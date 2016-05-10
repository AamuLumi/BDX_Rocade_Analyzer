import React, {Component} from 'react';
import BasicChart from './BasicChart';
import {AreaChart} from 'rd3';

const MAX_TRAFFIC = 3;

// 6 datas corrsponds to 6*5min=30minutes
const NB_DATAS_PER_RES = 10;
const REFRESH_TIME = 5;
const PERIOD_DATA = REFRESH_TIME * NB_DATAS_PER_RES;

// Time constants
const MS_IN_SECONDES = 1000;
const SECONDES_IN_MINUTES = 60;
const MINUTES_IN_HOURS = 60;
const HOURS_IN_DAY = 24;
const MS_IN_MINUTES = MS_IN_SECONDES * SECONDES_IN_MINUTES;
const MS_IN_HOURS = MS_IN_MINUTES * MINUTES_IN_HOURS;
const MS_IN_DAY = MS_IN_HOURS * HOURS_IN_DAY;

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
    let lastWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours());
    lastWeek.setTime(lastWeek.getTime() - MS_IN_DAY * 7);
    this.props.getData({'since': lastWeek, 'period': HOURS_IN_DAY *7});
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
      noDataLost = entry.p[id] > -1;

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
