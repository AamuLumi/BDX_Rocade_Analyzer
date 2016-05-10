import React, {Component} from 'react';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import {loadDataForUpChart, loadDataForDownChart} from '~/app/actions/Data';
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

  getChart(chartName, data, getData) {
    let {params} = this.props;
    let {width, height} = this.state;

    if (chartName === 'HistoryTraffic') {
      return (<Charts.HistoryTraffic
        data={data}
        id={parseInt(params.id)}
        getData={(req) => getData(req)}
        size={{
        width: width,
        height: height
      }}/>);
    } else if (chartName === 'WeekTraffic') {
      return (<Charts.WeekTraffic
        data={data}
        id={parseInt(params.id)}
        getData={(req) => getData(req)}
        size={{
        width: width,
        height: height
      }}/>);
    }
  }

  getDownChart() {
    return this.getChart(this.state.downChart, this.props.downData.data, (req) => this.props.fetchDownData(req));
  }

  getUpChart() {
    return this.getChart(this.state.upChart, this.props.upData.data,(req) => this.props.fetchUpData(req));
  }

  setUpChart(chartName) {
    const {upChart, downChart} = this.state;

    let nextState = {
      upChart: chartName
    };

    if (chartName === downChart) {
      nextState.downChart = upChart;
    }
    this.setState(nextState);
  }

  setDownChart(chartName) {
    const {upChart, downChart} = this.state;

    let nextState = {
      downChart: chartName
    };

    if (chartName === upChart) {
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
            {this.getUpChart(upChart)}
            {this.getDownChart(downChart)}
          </div>
        </div>
      </div>
    );
  }
}

// Connect to the store
const mapStateToProps = (state) => {
  return {upData: state.upChartData, downData: state.downChartData};
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchUpData: (request) => {
      dispatch(loadDataForUpChart(request));
    },
    fetchDownData: (request) => {
      dispatch(loadDataForDownChart(request));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PartViewer);
