import React, {Component} from 'react';
import {AreaChart} from 'rd3';
import BasicChart from './BasicChart';
import DateTools from '~/app/tools/DateTools';

const MAX_TRAFFIC = 3;

// 6 datas corrsponds to 6*5min=30minutes
const NB_DATAS_PER_RES = 10;
const REFRESH_TIME = 5;
const PERIOD_DATA = REFRESH_TIME * NB_DATAS_PER_RES;

const NOT_FOUND = -1;

function colors(b) {
  switch (b) {
    case 1:
      return '#e6550d';
    default:
      return ' #3182bd';
  }
}

colors.domain = function() {
  return;
};

export default class WeekTraffic extends BasicChart {
  componentWillMount() {
    super.componentWillMount();
    this.computeChartData();
  }

  componentWillReceiveProps(newProps) {
    this.props = newProps;

    this.computeChartData();
  }

  getData() {
    let currentDate = new Date();
    this.props.getData({'until': currentDate, 'period': DateTools.w2h(1)});
  }

  computeChartData() {
    let {data, id} = this.props;

    if (!data || !data[0]) {
      return undefined;
    }

    let res = [];

    let currentEntry = 0;
    let averageTraffic = 0;
    let lastDate = undefined;
    let currentDate = new Date();
    let noDataLost = false;

    let unavailableTraffic = [];

    for (let entry of data) {
      currentDate = new Date(entry.d);
      noDataLost = entry.p[id] > NOT_FOUND;

      if (noDataLost && currentEntry % NB_DATAS_PER_RES === 0) {
        res.push({
          x: currentDate,
          y: averageTraffic / NB_DATAS_PER_RES
        });
        unavailableTraffic.push({x: currentDate, y: 0});
        currentEntry = 0;
        averageTraffic = 0;
      } else if (!noDataLost && !lastDate) {
        // Beginning of a timeslot lost
        lastDate = currentDate;
      } else if (noDataLost && lastDate) {
        // If there's data lost, we must show this on the chart So
        // first, we add last datas to the chart, and add
        // associated point in the unavailable chart.
        res.push({
          x: lastDate,
          y: averageTraffic / currentEntry
        });
        unavailableTraffic.push({x: lastDate, y: 0});
        // We "reset" the res chart with adding the 0 value,  and we
        // show the data not found with adding the 3 value  to the
        // anavailable chart.
        res.push({x: lastDate, y: 0});
        unavailableTraffic.push({x: lastDate, y: 3});
        // We add the 3 value to the end of unavailable period
        res.push({x: currentDate, y: 0});
        unavailableTraffic.push({x: currentDate, y: 3});
        // We reset the unavailable chart
        unavailableTraffic.push({x: currentDate, y: 0});
        res.push({x: currentDate, y: entry.p[id]});

        currentEntry = 0;
        averageTraffic = 0;
        lastDate = undefined;
      }

      if (noDataLost) {
        currentEntry++;
        averageTraffic += entry.p[id];
      }
    }

    this.setState({
      entriesLength: res.length,
      chartData: [
        {
          name: 'trafficState',
          values: res
        }, {
          name: 'dataLost',
          values: unavailableTraffic
        }
      ]
    }, () => {
      this.calcXInterval(() => {
        this.render();
      });
    });
  }

  calcXInterval(callback) {
    let xTickInterval = {
      unit: 'day',
      interval: 1
    };

    this.setState({
      xTickInterval: xTickInterval
    }, () => {
      callback();
    });
  }

  render() {
    let {chartData, xTickInterval} = this.state;

    return (
      <div id="c-weekTraffic" className="basicChart">
        <div className="title">
          Etat du traffic sur la semaine
        </div>
        <AreaChart
          data={chartData}
          width={this.getWidth()}
          height={this.getHeight()}
          xAxisTickInterval={xTickInterval}
          yAxisTickCount={MAX_TRAFFIC}
          colors={colors}
          domain={{
          y: [0, MAX_TRAFFIC]
        }}/>
      </div>
    );
  }
}
