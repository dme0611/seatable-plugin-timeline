export default class Event {

  constructor(object = {}) {
    this.row = object.row || {};
    this.label = object.label || '';
    this.bgColor = object.bgColor || '';
    this.textColor = object.textColor || '';
    this.start = object.start || {};
    this.end = object.end || {};
  }
}