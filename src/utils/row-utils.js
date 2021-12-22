import moment from 'moment';
import { DATE_FORMAT, DATE_UNIT, GRID_VIEWS } from '../constants';

export const getEventWidth = (selectedGridView, columnWidth, eventStartDate, eventEndDate) => {
  const formattedStartDate = moment(eventStartDate).format(DATE_FORMAT.YEAR_MONTH_DAY);
  const formattedEndDate = moment(eventEndDate).format(DATE_FORMAT.YEAR_MONTH_DAY);
  let duration;
  if (selectedGridView === GRID_VIEWS.YEAR) {
    duration = moment(formattedEndDate).diff(formattedStartDate, DATE_UNIT.MONTH);
  } else if (selectedGridView === GRID_VIEWS.MONTH || selectedGridView === GRID_VIEWS.DAY) {
    duration = moment(formattedEndDate).diff(formattedStartDate, DATE_UNIT.DAY);
  }
  return (duration || 0) * columnWidth;
};

export const getEventLeft = (selectedGridView, columnWidth, overScanStartDate, eventStartDate) => {
  let duration;
  if (selectedGridView === GRID_VIEWS.YEAR) {
    let formattedOverScanStartDate = moment(overScanStartDate).format(DATE_FORMAT.YEAR_MONTH);
    let formattedStartDate = moment(eventStartDate).format(DATE_FORMAT.YEAR_MONTH);
    duration = moment(formattedStartDate).diff(formattedOverScanStartDate, DATE_UNIT.MONTH);
  } else if (selectedGridView === GRID_VIEWS.MONTH || selectedGridView === GRID_VIEWS.DAY) {
    const formattedOverScanStartDate = moment(overScanStartDate).format(DATE_FORMAT.YEAR_MONTH_DAY);
    const startDate = moment(eventStartDate).format(DATE_FORMAT.YEAR_MONTH_DAY);
    duration = moment(startDate).diff(formattedOverScanStartDate, DATE_UNIT.DAY);
  }
  return (duration || 0) * columnWidth;
};