import React, {Component} from 'react';
import BasicChart from './BasicChart';
import {AreaChart} from 'rd3';

const INTERVAL_HOURS = 6;
const MAX_TRAFFIC = 3;

export default class HistoryTraffic extends BasicChart {
  componentWillMount(){
    this.computeChartData();
  }

  componentWillReceiveProps(newProps){
    this.props = newProps;

    this.computeChartData();
  }

  computeChartData() {
    let {data, id} = this.props;

    if (!data || !data.parts) {
      return undefined;
    }

    let res = [];

    for (let c of data.parts) {
      for (let part of c.parts) {
        if (part.partNumber === id) {
          res.push({
            x: new Date(c._id),
            y: part.trafficState
          });
          break;
        }
      }
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
      this.render();
    });
  }

  getXInterval() {
    return INTERVAL_HOURS;
  }

  render() {
    let {size} = this.props;
    let {chartData} = this.state;

    return (
      <div id="c-historyTraffic">
        <AreaChart
          data={chartData}
          width={size.width}
          height={size.height}
          xAxisTickInterval={{
          unit: 'hour',
          interval: this.getXInterval
        }}
          yAxisTickCount={MAX_TRAFFIC}
          domain={{
          y: [0, MAX_TRAFFIC]
        }}
          title="Etat du traffic sur la portion actuelle"/>
      </div>
    );
  }
}
