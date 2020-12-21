import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ViewportLeft from './viewport-left';
import ViewportRight from './viewport-right';
import { zIndexes, HEADER_HEIGHT } from '../../constants';
import { getGroupViewportState, getGroupsHeight, getGroupVisibleBoundaries } from '../../utils/group-viewport-utils';
import * as EventTypes from '../../constants/event-types';

class GroupViewport extends Component {

  constructor(props) {
    super(props);
    this.state = {
      groups: props.groups || [],
      groupVisibleStartIdx: 0,
      groupVisibleEndIdx: 0,
    };
    this.scrollTop = 0;
  }

  componentDidMount() {
    let groupViewportHeight = this.groupViewport.offsetHeight - HEADER_HEIGHT;
    let { groups } = this.props;
    this.setState({
      ...getGroupViewportState(groupViewportHeight, groups)
    });
    this.unsubscribeResetScrollTop = this.props.eventBus.subscribe(EventTypes.RESET_VIEWPORT_SCROLL_TOP, this.onResetViewportScrollTop);
  }

  componentWillUnmount() {
    this.unsubscribeResetScrollTop();
  }

  onResetViewportScrollTop = () => {
    this.viewportLeft && this.viewportLeft.setCanvasLeftScroll(0);
    this.viewportRight && this.viewportRight.setCanvasRightScroll(0);
    this.updateScroll(0);
  }

  onExpandGroupToggle = (groupIndex, isExpanded) => {
    let {groups, groupVisibleStartIdx: oldGroupVisibleStartIdx } = this.state;
    let newGroups = [...groups];
    let updatedGroupIndex = groupIndex + oldGroupVisibleStartIdx;
    let updatedGroup = newGroups[groupIndex + oldGroupVisibleStartIdx];
    if (!updatedGroup) return;
    updatedGroup = {...updatedGroup, isExpanded};
    newGroups[updatedGroupIndex] = updatedGroup;
    let groupViewportHeight = this.groupViewport.offsetHeight - HEADER_HEIGHT;
    let { groupVisibleStartIdx, groupVisibleEndIdx } = getGroupVisibleBoundaries(groupViewportHeight, this.scrollTop, newGroups);
    this.setState({
      groups: newGroups,
      groupVisibleStartIdx,
      groupVisibleEndIdx
    });
  }

  getRenderedGroups = (groups, groupVisibleStartIdx, groupVisibleEndIdx) => {
    let groupsLength = groups.length;
    if (groupVisibleStartIdx >= groupsLength || groupVisibleEndIdx > groupsLength) {
      return [];
    }
    let i = groupVisibleStartIdx, renderGroups = [];
    while (i < groupVisibleEndIdx) {
      renderGroups.push(groups[i]);
      i++;
    }
    return renderGroups;
  }

  onViewportLeftScroll = (scrollTop) => {
    this.viewportRight && this.viewportRight.setCanvasRightScroll(scrollTop);
    this.props.onViewportLeftScroll();
    this.updateScroll(scrollTop);
  }

  onCanvasRightScroll = (scrollTop) => {
    this.viewportLeft && this.viewportLeft.setCanvasLeftScroll(scrollTop);
    this.props.onCanvasRightScroll();
    this.updateScroll(scrollTop);
  }

  updateScroll = (scrollTop) => {
    let { groups } = this.state;
    let groupViewportHeight = this.groupViewport.offsetHeight - HEADER_HEIGHT;
    let { groupVisibleStartIdx, groupVisibleEndIdx } = getGroupVisibleBoundaries(groupViewportHeight, scrollTop, groups);
    this.scrollTop = scrollTop;
    this.setState({
      groupVisibleStartIdx,
      groupVisibleEndIdx,
    });
  }

  render() {
    let { gridStartDate, gridEndDate, isShowUsers, selectedGridView, selectedDate, renderHeaderYears,
      renderHeaderDates, updateSelectedDate, eventBus, onRowExpand, changedSelectedByScroll,
      onViewportRightScroll } = this.props;
    let { groups, groupVisibleStartIdx, groupVisibleEndIdx } = this.state;
    let groupsLen = groups.length;
    let renderedGroups = this.getRenderedGroups(groups, groupVisibleStartIdx, groupVisibleEndIdx);
    let topOffset = groupVisibleStartIdx > 0 ? getGroupsHeight(groups, 0, groupVisibleStartIdx) : 0;
    let bottomOffset = (groupsLen - groupVisibleEndIdx) > 0 ? getGroupsHeight(groups, groupVisibleEndIdx + 1, groupsLen) : 0;
    return (
      <div className="timeline-group-viewport h-100 position-relative" ref={ref => this.groupViewport = ref}>
        {isShowUsers &&
          <div className="left-pane-wrapper position-absolute" style={{zIndex: zIndexes.LEFT_PANE_WRAPPER}}>
            <ViewportLeft
              ref={node => this.viewportLeft = node}
              isGroupView={true}
              groups={renderedGroups}
              topOffset={topOffset}
              bottomOffset={bottomOffset}
              onExpandGroupToggle={this.onExpandGroupToggle}
              onViewportLeftScroll={this.onViewportLeftScroll}
            />
          </div>
        }
        <ViewportRight
          ref={node => this.viewportRight = node}
          isShowUsers={isShowUsers}
          isGroupView={true}
          gridStartDate={gridStartDate}
          gridEndDate={gridEndDate}
          groups={renderedGroups}
          topOffset={topOffset}
          bottomOffset={bottomOffset}
          selectedGridView={selectedGridView}
          selectedDate={selectedDate}
          eventBus={eventBus}
          changedSelectedByScroll={changedSelectedByScroll}
          renderHeaderYears={renderHeaderYears}
          renderHeaderDates={renderHeaderDates}
          updateSelectedDate={updateSelectedDate}
          onRowExpand={onRowExpand}
          onCanvasRightScroll={this.onCanvasRightScroll}
          onViewportRightScroll={onViewportRightScroll}
        />
      </div>
    );
  }
}

GroupViewport.propTypes = {
  isShowUsers: PropTypes.bool,
  gridStartDate: PropTypes.string,
  gridEndDate: PropTypes.string,
  selectedGridView: PropTypes.string,
  selectedDate: PropTypes.string,
  groups: PropTypes.array,
  eventBus: PropTypes.object,
  changedSelectedByScroll: PropTypes.bool,
  renderHeaderYears: PropTypes.func,
  renderHeaderDates: PropTypes.func,
  updateSelectedDate: PropTypes.func,
  onViewportRightScroll: PropTypes.func,
  onRowExpand: PropTypes.func,
};

export default GroupViewport;