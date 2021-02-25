import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { ROW_HEIGHT } from '../../constants';
import Cell from '../row/cell';

class Rows extends React.Component {

  render() {
    const { rows, columns, collaborators } = this.props;
    return (
      <Fragment>
        {Array.isArray(rows) && rows.map((row, index) => {
          return (
            <div className="timeline-row d-flex" style={{height: ROW_HEIGHT}} key={index}>
              {columns.map((column, index) => {
                return <Cell key={index} row={row.row} column={column} collaborators={collaborators} />
              })}
            </div>
          );
        })}
      </Fragment>
    );
  }
}

Rows.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.array,
  collaborators: PropTypes.array
};

export default Rows;
