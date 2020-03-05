import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import TimelineToolbar from './components/timeline-toolbar';
import ViewportLeft from './components/timeline-viewport/viewport-left';
import Month from './components/timeline-views/month';
import { dates } from './utils';
import { NAVIGATE, VIEW_TYPE, DATE_UNIT, zIndexs, COLUMN_WIDTH } from './constants';

import './css/timeline.css';

const propTypes = {
  rows: PropTypes.array,
  selectedDate: PropTypes.string,
  selectedTimelineView: PropTypes.string,
  onNavigate: PropTypes.func,
};

class Timeline extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isShowCollaborators: true
    };
  }

  onShowCollaboratorsToggle = () => {
    this.setState({isShowCollaborators: !this.state.isShowCollaborators});
  }

  onNavigate = (action) => {
    let { selectedDate, selectedTimelineView } = this.props;
    selectedDate = selectedDate || dates.getToday('YYYY-MM-DD');
    if (action === NAVIGATE.PREVIOUS) {
      if (selectedTimelineView === VIEW_TYPE.MONTH) {
        selectedDate = moment(selectedDate).subtract(1, DATE_UNIT.MONTH).format('YYYY-MM-DD');
      }
    } else if (action === NAVIGATE.NEXT) {
      if (selectedTimelineView === VIEW_TYPE.MONTH) {
        selectedDate = moment(selectedDate).add(1, DATE_UNIT.MONTH).format('YYYY-MM-DD');
      }
    } else if (action === NAVIGATE.TODAY) {
      selectedDate = dates.getToday('YYYY-MM-DD');
    }
    this.props.onNavigate(selectedDate);
  }

  isToday = () => {
    let { selectedDate, selectedTimelineView } = this.props;
    let today = moment();
    let yearOfSelectedDate = moment(selectedDate).year();
    let monthOfSelectedDate = moment(selectedDate).month();
    let yearOfToday = today.year();
    let monthOfToday = today.month();
    if (selectedTimelineView === VIEW_TYPE.MONTH) {
      return yearOfSelectedDate === yearOfToday &&
        monthOfSelectedDate === monthOfToday;
    }
    return false;
  }

  onViewportLeftScroll = ({scrollLeft, scrollTop}) => {
    this.gridView && this.gridView.setScroll({scrollLeft, scrollTop});
  }

  onViewportRightScroll = ({scrollLeft, scrollTop}) => {
    this.viewportLeft && this.viewportLeft.setScroll({scrollLeft, scrollTop});
  }

  render() {
    let { isShowCollaborators } = this.state;
    let { rows, selectedDate } = this.props;
    let isToday = this.isToday();
    let days = dates.getDaysInMonth(selectedDate);
    let startDateOfMonth = moment(selectedDate).startOf(DATE_UNIT.MONTH).format('YYYY-MM-DD');
    let minWidth = days.length * COLUMN_WIDTH;
    let rightPaneWrapperStyle = {
      marginLeft: isShowCollaborators && 180
    }
    return (
      <div className="timeline-container position-relative">
        {isShowCollaborators &&
          <div className="left-pane-wrapper position-absolute" style={{zIndex: zIndexs.LEFT_PANE_WRAPPER}}>
            <div className="blank-zone"></div>
            <ViewportLeft
              ref={node => this.viewportLeft = node}
              rows={rows}
              onViewportLeftScroll={this.onViewportLeftScroll}
            />
          </div>
        }
        <div className="right-pane-wrapper" style={rightPaneWrapperStyle}>
          <TimelineToolbar
            isToday={isToday}
            days={days}
            selectedDate={selectedDate}
            isShowCollaborators={isShowCollaborators}
            onShowCollaboratorsToggle={this.onShowCollaboratorsToggle}
            onNavigate={this.onNavigate}
          />
          <Month
            ref={node => this.gridView = node}
            isToday={isToday}
            days={days}
            rows={rows}
            minWidth={minWidth}
            selectedDate={selectedDate}
            startDateOfMonth={startDateOfMonth}
            onViewportRightScroll={this.onViewportRightScroll}
          />
        </div>
      </div>
    );
  }
}

Timeline.propTypes = propTypes;

export default Timeline;