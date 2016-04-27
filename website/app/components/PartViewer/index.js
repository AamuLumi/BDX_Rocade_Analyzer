import React, {Component} from 'react';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import {fetchPartsIfNeeded} from '~/actions/Rocade';
import Charts from './Charts';

import './PartViewer.less';

class PartViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 500,
      height: 300
    };
  }

  componentWillMount() {
    this.props.fetchParts();
  }

  componentDidMount() {
    let position = this.getPosition();

    if (position) {
      this.setState({
        width: position.right - position.left
      });
    }
  }

  getPosition() {
    let pv = document.getElementById('c-partViewer');

    if (pv) {
      return pv.getBoundingClientRect();
    }

    return undefined;
  }

  render() {
    let {data, params} = this.props;
    let {width, height} = this.state;

    return (
      <div id="c-partViewer">
        <div className="title">
          <Link to="/">&#x25C0;</Link>&nbsp; Portion n°{params.id}
        </div>

        <Charts.HistoryTraffic
          data={data}
          id={parseInt(params.id)}
          size={{width: width, height: height}}/>
      </div>
    );
  }
}

// Connect to the store
const mapStateToProps = (state) => {
  return {data: state.loadParts};
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchParts: (request) => {
      dispatch(fetchPartsIfNeeded(request));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PartViewer);
