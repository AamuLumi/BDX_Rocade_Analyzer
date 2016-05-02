import React, {Component} from 'react';
import BasicChart from './BasicChart';
import {AreaChart} from 'rd3';

const MAX_TRAFFIC = 3;

// 6 datas corrsponds to 6*5min=30minutes
const NB_DATAS_PER_RES = 4;

export default class WeekTraffic extends BasicChart {
  componentWillMount() {
    this.computeChartData();
  }

  componentWillReceiveProps(newProps) {
    this.props = newProps;

    this.computeChartData();
  }

  computeChartData() {
    let {data, id} = this.props;

    if (!data || !data.parts || !data.parts[0]) {
      return undefined;
    }

    let res = [];
    let currentEntry = 0;
    let averageTraffic = 0;

    for (let entry of data.parts[0].dates) {
      if (currentEntry % NB_DATAS_PER_RES === 0) {
        res.push({
          x: new Date(entry.date),
          y: averageTraffic / NB_DATAS_PER_RES
        });
        currentEntry = 0;
        averageTraffic = 0;
      }

      averageTraffic += entry.trafficState;

      currentEntry++;

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
    let {size} = this.props;
    let {chartData, xTickInterval} = this.state;

    console.log(chartData);

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
          domain={{
          y: [0, MAX_TRAFFIC]
        }}/>
      </div>
    );
  }
}
