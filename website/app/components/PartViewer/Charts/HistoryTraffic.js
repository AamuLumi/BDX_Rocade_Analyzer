import React, {Component} from 'react';
import BasicChart from './BasicChart';
import {AreaChart} from 'rd3';

const INTERVAL_HOURS = 6;
const MAX_TRAFFIC = 3;

const STEP_FEW_DATAS = 7;
const STEP_MID_DATAS = 40;

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

    if (!data) {
      return undefined;
    }

    let res = [];

    for (let entry of data) {
      res.push({
        x: new Date(entry.d),
        y: entry.p[id]
      });
    }

    this.setState({
      entriesLength: res.length,
      chartData: [
        {
          name: 'trafficState',
          values: res
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
          domain={{
          y: [0, MAX_TRAFFIC]
        }}/>
      </div>
    );
  }
}
