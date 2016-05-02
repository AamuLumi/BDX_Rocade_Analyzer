import React, {Component} from 'react';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import {fetchPartsByDateIfNeeded, fetchPartsByPartIfNeeded} from '~/actions/Rocade';
import Charts from './Charts';
import ChartSelector from './ChartSelector';

import './PartViewer.less';

const PADDING_HORIZONTAL = 20;
const TOTAL_PADDING_HORIZONTAL = PADDING_HORIZONTAL * 2;

// Size in the page of a chart in percent => 0.45 = 45% It
// don't consider size of title
const CHART_SIZE = 0.50;

const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const HOURS_IN_WEEK = HOURS_IN_DAY * DAYS_IN_WEEK;

class PartViewer extends Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    hasBack: React.PropTypes.bool
  }

  constructor(props) {
    super(props);
    this.state = {
      width: 500,
      height: 300,
      upChart: 'HistoryTraffic',
      downChart: 'WeekTraffic'
    };
  }

  componentWillMount() {
    window.addEventListener('resize', (e) => {
      this.handleResize(e);
    });

    if (!this.props.hasBack) {
      this.props.fetchPartsByDate();
      this.props.fetchPartsByPart({partNumber: this.props.params.id, period: HOURS_IN_WEEK});
    }
  }

  componentDidMount() {
    this.updateSize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', (e) => {
      this.handleResize(e);
    });
  }

  /**
   * Called when the window is resized
   */
  handleResize() {
    this.updateSize();
    this.render();
  }

  updateSize() {
    let position = this.getPosition();

    if (position) {
      this.setState({
        width: position.right - position.left - TOTAL_PADDING_HORIZONTAL,
        height: (position.bottom - position.top) * CHART_SIZE
      });
    }
  }

  getPosition() {
    let pv = document.getElementById('charts');

    if (pv) {
      return pv.getBoundingClientRect();
    }

    return undefined;
  }

  goHome() {
    if (this.props.hasBack) {
      this.context.router.goBack();
    } else {
      this.context.router.push('/');
    }
  }

  getChart(chartName) {
    let {dataByDate, dataByPart, params} = this.props;
    let {width, height} = this.state;

    if (chartName === 'HistoryTraffic') {
      return (<Charts.HistoryTraffic
        data={dataByDate}
        id={parseInt(params.id)}
        size={{
        width: width,
        height: height
      }}/>);
    } else if (chartName === 'WeekTraffic') {
      return (<Charts.WeekTraffic
        data={dataByPart}
        id={parseInt(params.id)}
        size={{
        width: width,
        height: height
      }}/>);
    }
  }

  setUpChart(chartName) {
    const {upChart, downChart} = this.state;

    let nextState = {upChart: chartName};

    if (chartName === downChart){
      nextState.downChart = upChart;
    }
    this.setState(nextState);
  }

  setDownChart(chartName) {
    const {upChart, downChart} = this.state;

    let nextState = {downChart: chartName};

    if (chartName === upChart){
      nextState.upChart = downChart;
    }
    this.setState(nextState);
  }

  render() {
    let {params} = this.props;
    let {upChart, downChart} = this.state;

    return (
      <div id="c-partViewer">
        <div className="container">
          <div className="header">
            <div className="title">
              <span
                className="backButton"
                onClick={() => {
                this.goHome();
              }}>&#x25C0;</span>&nbsp; Portion n°{params.id}
            </div>
            <ChartSelector
              setUpChart={(name) => this.setUpChart(name)}
              setDownChart={(name) => this.setDownChart(name)}/>
          </div>

          <div id="charts">
            {this.getChart(upChart)}
            {this.getChart(downChart)}
          </div>
        </div>
      </div>
    );
  }
}

// Connect to the store
const mapStateToProps = (state) => {
  return {dataByDate: state.partsByDate, dataByPart: state.partsByPart};
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchPartsByDate: (request) => {
      dispatch(fetchPartsByDateIfNeeded(request));
    },
    fetchPartsByPart: (request) => {
      dispatch(fetchPartsByPartIfNeeded(request));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PartViewer);
