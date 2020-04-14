import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import moment from 'moment';
import EventRow from '../event-row';
import EventCell from '../event-cell';
import { dates } from '../../utils';
import { ROW_HEIGHT, DATE_UNIT, DATE_FORMAT, zIndexs, GRID_VIEWS } from '../../constants';
import EventFormatter from '../../components/cell-formatter/event-formatter';
import intl from 'react-intl-universal';
import '../../locale';

const propTypes = {
  days: PropTypes.array,
  rows: PropTypes.array,
  selectedGridView: PropTypes.string,
  selectedDate: PropTypes.string,
  columnWidth: PropTypes.number,
  startDateOfMonth: PropTypes.string,
  endDateOfMonth: PropTypes.string,
  onViewportRightScroll: PropTypes.func,
  onRowExpand: PropTypes.func,
};

class CanvasRight extends React.Component {

  renderEventRows = () => {
    let { rows } = this.props;
    if (!rows || rows.length === 0) {
      return <div className="no-events d-flex align-items-center justify-content-center">{intl.get('There_are_no_records')}</div>
    }
    return (
      <React.Fragment>
        <div className="events-bg position-absolute" style={{zIndex: zIndexs.EVENTS_BG}}>
          {Array.isArray(rows) && rows.map((r, index) => {
            return (
              <EventRow
                key={`events-bg-row-${index}`}
                cells={this.renderBgCells()}
              />
            );
          })}
        </div>
        <div className="events-rows position-absolute">
          {Array.isArray(rows) && rows.map((r, index) => {
            return (
              <EventRow
                key={`timeline-events-row-${index}`}
                cells={this.renderEventCells(r, index)}
              />
            );
          })}
        </div>
      </React.Fragment>
    );
  }

  renderEventCells = (eventRow, rowIndex) => {
    let { overscanDates } = this.props;
    let { events } = eventRow;
    let overscanStartDate = overscanDates[0];
    let overscanEndDate = overscanDates[overscanDates.length - 1];
    let displayEvents = this.getEventsInRange(events, overscanStartDate, overscanEndDate);
    return displayEvents.map((e) => {
      let { label, bgColor, start, end, row } = e;
      if (!row) return null;
      let width = this.getEventWidth(start, end);
      let left = this.getEventLeft(overscanStartDate, start);
      let { _id: rowId } = row;
      return (
        <EventCell
          key={`timeline-event-cell-${rowIndex}_${rowId}`}
          style={{left, zIndex: zIndexs.EVENT_CELL, width}}
          row={row}
          id={`timeline_event_cell_${rowIndex}_${rowId}`}
          onRowExpand={this.props.onRowExpand}
          formatter={<EventFormatter label={label} bgColor={bgColor} start={start} end={end} />}
        />
      );
    });
  }

  renderBgCells = () => {
    let { overscanDates, columnWidth } = this.props;
    return overscanDates.map((d) => {
      let week = dates.getDate2Week(d);
      let isEndRange = this.isEndOfRange(d);
      let isWeekend = this.isWeekend(week);
      return (
        <div
          key={`timeline-day-bg-${d}`}
          name={d}
          className={classnames({'timeline-day-bg': true, 'sun-or-sat-day': isWeekend, 'd-inline-block': true, 'end-of-range': isEndRange})}
          style={{width: columnWidth}}
        ></div>
      );
    });
  }

  getEventsInRange = (events, startDate, endDate) => {
    let { selectedGridView, selectedDate } = this.props;
    if (!Array.isArray(events)) {
      return [];
    }
    return events.filter(e => {
      let { start: eventStartDate, end: eventEndDate } = e;
      let isValidEvent = true;
      if (selectedGridView === GRID_VIEWS.YEAR) {
        isValidEvent = moment(eventEndDate).diff(eventStartDate, DATE_UNIT.MONTH) > 0;
      } else {
        isValidEvent = moment(eventEndDate).isSameOrAfter(eventStartDate);
      }
      return isValidEvent && (dates.isDateInRange(eventStartDate, startDate, endDate) ||
        dates.isDateInRange(eventEndDate, startDate, endDate) ||
        dates.isDateInRange(selectedDate, eventStartDate, eventEndDate));
    });
  }

  getEventWidth = (eventStartDate, eventEndDate) => {
    let { selectedGridView, columnWidth } = this.props;
    let duration = 0;
    if (selectedGridView === GRID_VIEWS.YEAR) {
      duration = moment(eventEndDate).diff(moment(eventStartDate), DATE_UNIT.MONTH) + 1;
    } else if (selectedGridView === GRID_VIEWS.MONTH || selectedGridView === GRID_VIEWS.DAY) {
      duration = moment(eventEndDate).diff(moment(eventStartDate), DATE_UNIT.DAY) + 1;
    }
    return duration * columnWidth;
  }

  getEventLeft = (overscanStartDate, startDate) => {
    let { selectedGridView, columnWidth } = this.props;
    if (selectedGridView === GRID_VIEWS.YEAR) {
      let formattedOverscanStartDate = moment(overscanStartDate).format(DATE_FORMAT.YEAR_MONTH);
      let formattedStartDate = moment(startDate).format(DATE_FORMAT.YEAR_MONTH);
      return moment(formattedStartDate).diff(formattedOverscanStartDate, DATE_UNIT.MONTH) * columnWidth;
    } else if (selectedGridView === GRID_VIEWS.MONTH || selectedGridView === GRID_VIEWS.DAY) {
      return moment(startDate).diff(overscanStartDate, DATE_UNIT.DAY) * columnWidth;
    }
  }

  renderTodayMarkLine = () => {
    let { rows, overscanDates, selectedGridView, columnWidth } = this.props;
    let today = moment();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    if (selectedGridView === GRID_VIEWS.YEAR) {
      today = today.startOf(DATE_UNIT.MONTH).format(DATE_FORMAT.YEAR_MONTH_DAY);
    } else if (selectedGridView === GRID_VIEWS.MONTH) {
      today = today.format(DATE_FORMAT.YEAR_MONTH_DAY);
    } else {
      today = today.format(DATE_FORMAT.YEAR_MONTH_DAY);
    }
    let todayIndex = overscanDates.indexOf(today);
    if (todayIndex < 0) return null;
    let left = todayIndex * columnWidth + columnWidth / 2;
    let height = rows.length * ROW_HEIGHT;
    return <div
      className="today-mark-line position-absolute"
      style={{
        top: 0,
        height,
        left,
        zIndex: zIndexs.TODAY_MARK_LINE,
      }}></div>;
  }

  isWeekend = (week) => {
    let { selectedGridView } = this.props;
    if (selectedGridView === GRID_VIEWS.DAY) {
      return week === 'S';
    }
    return false;
  }

  isEndOfRange = (date) => {
    let { selectedGridView } = this.props;
    if (selectedGridView === GRID_VIEWS.YEAR) {
      return moment(date).endOf(DATE_UNIT.YEAR).format(DATE_FORMAT.YEAR_MONTH) === moment(date).format(DATE_FORMAT.YEAR_MONTH);
    } else if (selectedGridView === GRID_VIEWS.DAY || GRID_VIEWS.MONTH) {
      return moment(date).endOf(DATE_UNIT.MONTH).format(DATE_FORMAT.YEAR_MONTH_DAY) === date;
    }
    return false;
  }

  onViewportRightScroll = (event) => {
    let scrollLeft = event.target.scrollLeft;
    let scrollTop = event.target.scrollTop;
    this.setViewportRightScroll({scrollLeft, scrollTop});
    this.props.onViewportRightScroll({scrollLeft, scrollTop});
  }

  setViewportRightScroll = ({scrollLeft, scrollTop}) => {
    this.viewportRight.scrollLeft = scrollLeft;
    this.viewportRight.scrollTop = scrollTop;
  }

  onCanvasRightScroll = (evt) => {
    evt.stopPropagation();
    this.props.onCanvasRightScroll(evt.target.scrollTop);
  }

  setCanvasRightScroll = (scrollTop) => {
    this.canvasRight.scrollTop = scrollTop;
  }

  render() {
    let { columnWidth, startOffset, endOffset, overscanDates } = this.props;
    let canvasRightStyle = {
      width: overscanDates.length * columnWidth + startOffset + endOffset,
      paddingLeft: startOffset,
      paddingRight: endOffset,
    };
    return (
      <div className="canvas-right" ref={ref => this.canvasRight = ref} style={canvasRightStyle} onScroll={this.onCanvasRightScroll}>
        <div className="position-relative" style={{width: '100%', height: '100%'}}>
          {this.renderEventRows()}
          {this.renderTodayMarkLine()}
        </div>
      </div>
    );
  }
}

CanvasRight.propTypes = propTypes;

export default CanvasRight;