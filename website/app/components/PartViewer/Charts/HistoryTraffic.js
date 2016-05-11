import React, {Component} from 'react';
import BasicChart from './BasicChart';
import {AreaChart} from 'rd3';

const INTERVAL_HOURS = 6;
const MAX_TRAFFIC = 3;

const STEP_FEW_DATAS = 7;
const STEP_MID_DATAS = 40;

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

export default class HistoryTraffic extends BasicChart {
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
    let currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0);
    this.props.getData({'since': currentDay, 'period': currentDate.getHours()});
  }

  computeChartData() {
    let {data, id} = this.props;

    if (!data || !data[0]) {
      return undefined;
    }

    let res = [];
    let unavailableTraffic = [];
    let unavailableState = false;
    let lastDate = data[0].d;

    for (let entry of data) {
      if (entry.p[id] >= 0){
        if (unavailableState){
          res.push({
            x: lastDate,
            y: entry.p[id]
          });
          unavailableTraffic.push({
            x: lastDate,
            y: 0
          });
          unavailableState = false;
        }
        res.push({
          x: entry.d,
          y: entry.p[id]
        });
        unavailableTraffic.push({
          x: entry.d,
          y: 0
        });
      } else {
        if (!unavailableState){
          res.push({
            x: lastDate,
            y: 0
          });
          unavailableTraffic.push({
            x: lastDate,
            y: 3
          });
          unavailableState = true;
        }
        res.push({
          x: entry.d,
          y: 0
        });
        unavailableTraffic.push({
          x: entry.d,
          y: 3
        });
      }

      lastDate = entry.d;
    }

    this.setState({
      entriesLength: res.length,
      chartData: [
        {
          name: 'trafficState',
          values: res
        }, {
          name: 'notFound',
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
    let {entriesLength} = this.state;

    let xTickInterval = {
      unit: 'hour',
      interval: 1
    };

    if (entriesLength < STEP_FEW_DATAS) {
      xTickInterval = {
        unit: 'minute',
        interval: 5
      };
    } else if (entriesLength < STEP_MID_DATAS) {
      xTickInterval = {
        unit: 'minute',
        interval: 15
      };
    }

    this.setState({
      xTickInterval: xTickInterval
    }, () => {
      callback();
    });
  }

  render() {
    let {chartData, xTickInterval} = this.state;

    return (
      <div id="c-historyTraffic" className="basicChart">
        <div className="title">
          Etat du traffic sur la portion actuelle
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
