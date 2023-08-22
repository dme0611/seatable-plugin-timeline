import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import DTable from 'dtable-sdk';
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


const propTypes = {
  showDialog: PropTypes.bool
};

class App extends React.Component {

  constructor(props) {                                                   // Anfangszustand beschrieben
    super(props);
    this.state = {
      isLoading: true,
      showDialog: props.showDialog || false,
      plugin_settings: {}
    };
    this.eventBus = new EventBus();
    this.dtable = new DTable();
  }

  componentDidMount() {                                                 // hinzufügen der Komponenten auf den Bildschirm
    this.initPluginDTableData();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {                         // Soll eigentlich nicht mehr verwendet werden https://react.dev/reference/react/Component#unsafe_componentwillreceiveprops
    this.setState({showDialog: nextProps.showDialog});                  // wenn ich das weglasse, kannn ich nachdem ich das Plugin geschlossen habe, es nicht mehr öffnen
  }

  componentWillUnmount() {                                              // Gegenstück von componentDidMount() --> aufräumen
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

  onDTableConnect = () => {
    this.resetData();
  }

  onDTableChanged = () => {
    this.resetData();
  }

  resetData = () => {
    this.setState({isLoading: false});
  }

  onPluginToggle = () => {
    setTimeout(() => {
      this.setState({showDialog: false});
    }, 500);
    window.app.onClosePlugin && window.app.onClosePlugin();
  }

  render() {
    let { isLoading, showDialog } = this.state;
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
          <div className="plugin-logo">
            <img className="plugin-logo-icon" src={timelineLogo} alt="Timeline" />
            <span>{intl.get('Timeline')}</span>
          </div>
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
