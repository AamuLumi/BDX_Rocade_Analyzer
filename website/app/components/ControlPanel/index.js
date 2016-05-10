// Imports
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {loadDataForViewer} from '~/actions/Data';
import PeriodPicker from './PeriodPicker';
import './ControlPanel.less';

class ControlPanel extends Component {
  sendRequest() {
    this.props.fetchParts(this.refs.periodPicker.getRequest());
  }

  render() {
    return (
      <div id="c-controlPanel">
        <div className="title">
          Configuration
        </div>

        <PeriodPicker ref="periodPicker" />
        <button onClick={() => this.sendRequest()}>Actualiser</button>
      </div>
    );
  }
}

// Connect to stores
const mapDispatchToProps = (dispatch) => {
  return {
    fetchParts: (request) => {
      dispatch(loadDataForViewer(request));
    }
  };
};

export default connect(null, mapDispatchToProps)(ControlPanel);
