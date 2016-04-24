import React, {Component} from 'react';
import {connect} from 'react-redux';
import {fetchPartsIfNeeded} from '~/actions/Rocade';
import PeriodPicker from './PeriodPicker';
import './ControlPanel.less';

class ControlPanel extends Component {
  componentDidMount() {
    this.props.fetchParts();
  }

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

const mapDispatchToProps = (dispatch) => {
  return {
    fetchParts: (request) => {
      dispatch(fetchPartsIfNeeded(request));
    }
  };
};

export default connect(null, mapDispatchToProps)(ControlPanel);
