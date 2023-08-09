import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import intl from 'react-intl-universal';
import DTable, { CELL_TYPE, FORMULA_RESULT_TYPE, sortDate } from 'dtable-sdk';
import ViewsTabs from './components/views-tabs';
import Timeline from './timeline';
import View from './model/view';
import Group from './model/group';
import TimelineRow from './model/timeline-row';
import Event from './model/event';
import {
  PLUGIN_NAME, SETTING_KEY, DEFAULT_BG_COLOR, DEFAULT_TEXT_COLOR, RECORD_END_TYPE,
  DATE_UNIT, COLLABORATOR_COLUMN_TYPES,
} from './constants';
import { generatorViewId, getDtableUuid } from './utils';
import { getCollaboratorsDisplayString } from './utils/value-format-utils';
import EventBus from './utils/event-bus';

import './locale';
import timelineLogo from './assets/image/timeline.png';

import './css/app.css';

/**
 * notes:
 * convertedRows: [ convertedRow, ... ],
 * convertedRow: { [row._id]: rowId, [column.name]: 'xxx' }
 * originalRow: { [row._id]: rowId, [column.key]: 'xxx' }
 */

const DEFAULT_PLUGIN_SETTINGS = {
  views: [
    {
      _id: '0000',
      name: `${intl.get('Default_View')}`,
      settings: {}
    }
  ]
};
const KEY_SELECTED_VIEW_IDS = `${PLUGIN_NAME}-selectedViewIds`;

const EMPTY_LABEL = `(${intl.get('Empty')})`;

const propTypes = {
  showDialog: PropTypes.bool
};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      showDialog: props.showDialog || false,
      isShowTimelineSetting: false,
      plugin_settings: {},
      selectedViewIdx: 0,
    };
    this.eventBus = new EventBus();
    this.dtable = new DTable();
  }

  componentDidMount() {
    this.initPluginDTableData();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({showDialog: nextProps.showDialog});
  }

  componentWillUnmount() {
    this.unsubscribeLocalDtableChanged();
    this.unsubscribeRemoteDtableChanged();
  }

  async initPluginDTableData() {
    if (window.app === undefined) {
      // local develop
      window.app = {};
      window.app.state = {};
      window.dtable  = {};
      await this.dtable.init(window.dtablePluginConfig);
      await this.dtable.syncWithServer();
      let relatedUsersRes = await this.getRelatedUsersFromServer(this.dtable.dtableStore);
      const userList = relatedUsersRes.data.user_list;
      window.app.collaborators = userList;
      window.app.state.collaborators = userList;
      this.dtable.subscribe('dtable-connect', () => { this.onDTableConnect(); });
    } else {
      // integrated to dtable app
      this.dtable.initInBrowser(window.app.dtableStore);
    }
    this.unsubscribeLocalDtableChanged = this.dtable.subscribe('local-dtable-changed', () => { this.onDTableChanged(); });
    this.unsubscribeRemoteDtableChanged = this.dtable.subscribe('remote-dtable-changed', () => { this.onDTableChanged(); });
    this.resetData(true);
  }

  async getRelatedUsersFromServer(dtableStore) {
    return dtableStore.dtableAPI.getTableRelatedUsers();
  }

  resetData = (init = false) => {
    let { showDialog, isShowTimelineSetting } = this.state;
    let plugin_settings = this.dtable.getPluginSettings(PLUGIN_NAME) || {};
    if (!plugin_settings || Object.keys(plugin_settings).length === 0) {
      plugin_settings = DEFAULT_PLUGIN_SETTINGS;
    }
    let { views } = plugin_settings;
    let dtableUuid = getDtableUuid();
    let selectedViewIds = this.getSelectedViewIds(KEY_SELECTED_VIEW_IDS) || {};
    let selectedViewId = selectedViewIds[dtableUuid];
    let selectedViewIdx = views.findIndex(v => v._id === selectedViewId);
    selectedViewIdx = selectedViewIdx > 0 ? selectedViewIdx : 0;
    if (init) {
      isShowTimelineSetting = !this.isValidViewSettings(views[selectedViewIdx].settings);
      showDialog = true;
    }
    this.columnIconConfig = this.dtable.getColumnIconConfig();
    this.optionColorsMap = this.getOptionColorsMap();
    this.initCollaborators();
    this.setState({
      isLoading: false,
      showDialog,
      plugin_settings,
      selectedViewIdx,
      isShowTimelineSetting
    });
  }

  onPluginToggle = () => {
    setTimeout(() => {
      this.setState({showDialog: false});
    }, 500);
    window.app.onClosePlugin && window.app.onClosePlugin();
  }

  onTimelineSettingToggle = () => {
    this.setState({isShowTimelineSetting: !this.state.isShowTimelineSetting});
  }

  onHideTimelineSetting = () => {
    this.setState({isShowTimelineSetting: false});
  }

  getOptionColorsMap = () => {
    let optionColors = this.dtable.getOptionColors();
    if (!Array.isArray(optionColors)) {
      return {};
    }
    let optionColorsMap = {};
    optionColors.forEach((optionColor) => {
      optionColorsMap[optionColor.COLOR] = optionColor.TEXT_COLOR;
    });
    return optionColorsMap;
  }

  getRelatedUsersFromLocal = () => {
    let { collaborators, state } = window.app;
    if (!collaborators) {
      // dtable app
      return state && state.collaborators;
    }
    return collaborators; // local develop
  }

  initCollaborators = () => {
    this.collaborators = this.getRelatedUsersFromLocal();
    this.emailCollaboratorMap = {};
    this.collaborators.forEach(collaborator => {
      this.emailCollaboratorMap[collaborator.email] = collaborator;
    });
  }

  getSelectedViewIds = (key) => {
    let selectedViewIds = window.localStorage.getItem(key);
    return selectedViewIds ? JSON.parse(selectedViewIds) : {};
  }

  isValidViewSettings = (settings) => {
    return settings && Object.keys(settings).length > 0;
  }

  onExportAsImage = () => {
    this.timeline.onExportAsImage();
  }

  onTimelineClick = () => {
    const { isShowTimelineSetting } = this.state;
    if (isShowTimelineSetting) {
      this.onHideTimelineSetting();
    }
  }




  render() {
    let { isLoading, showDialog, isShowTimelineSetting, plugin_settings, selectedViewIdx } = this.state;
    if (isLoading || !showDialog) {
      return '';
    }

    if (window.app === undefined) {
      /* eslint-disable */
      console.log(`---------- Timeline plugin logs start ----------`);
      if (isGroupView) {
        console.log(groups);
      } else {
        console.log(rows);
      }
      console.log(`----------- Timeline plugin logs end -----------`);
    }

    return (
      <div className="dtable-plugin plugin-timeline" ref={ref => this.plugin = ref} onClick={this.onTimelineClick}>
        <div className="plugin-header">
        <div className="timeline-operators">
            <span className="timeline-operator dtable-font dtable-icon-download btn-export-image" onClick={this.onExportAsImage}></span>
            <span className="timeline-operator dtable-font dtable-icon-set-up btn-settings" onClick={this.onTimelineSettingToggle}></span>
            <span className="timeline-operator dtable-font dtable-icon-x btn-close" onClick={this.onPluginToggle}></span>
          </div>
        </div>
      </div>
    );
  }
}

App.propTypes = propTypes;

export default App;
