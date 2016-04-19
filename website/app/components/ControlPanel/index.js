import React, {Component} from 'react';
import {connect} from 'react-redux';
import {fetchPartsIfNeeded} from '~/actions/Rocade';
import './ControlPanel.less';

class ControlPanel extends Component {
  componentDidMount(){
    this.props.fetchParts();
  }
  render() {
    return (
      <div id="c-controlPanel">
        <div className="title">
          Configuration
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchParts : (request) => {
      dispatch(fetchPartsIfNeeded(request));
    }
  };
};

export default connect(null, mapDispatchToProps)(ControlPanel);
