import React, {Component} from 'react';
import './BasicChart.less';

const TITLE_HEIGHT = 72;

export default class BasicChart extends Component {
  static propTypes = {
    data: React.PropTypes.array.isRequired,
    id: React.PropTypes.number.isRequired,
    size: React.PropTypes.object.isRequired,
    getData: React.PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);

    this.state = {
      entriesLength: 0,
      chartData: [
        {
          name: 'trafficState',
          values: []
        }
      ],
      xTickInterval : {
        unit: 'hour',
        interval: 1
      }
    };
  }

  componentWillMount(){
    this.getData();
  }

  getData(){
    return;
  }

  getXInterval(){
    return this.state.entriesLength;
  }

  getWidth(){
    if (this.props.size.width){
      return this.props.size.width;
    }

    return 0;
  }

  getConfigurationMenu(){
    return;
  }

  getHeight(){
    if (this.props.size.height){
      return this.props.size.height - TITLE_HEIGHT;
    }

    return 0;
  }
}
