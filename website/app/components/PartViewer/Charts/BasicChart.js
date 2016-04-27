import React, {Component} from 'react';

export default class BasicChart extends Component {
  static propTypes = {
    data: React.PropTypes.object.isRequired,
    id: React.PropTypes.number.isRequired,
    size: React.PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

    this.state = {
      entriesLength: 0,
      chartData: undefined
    };
  }

  getXInterval(){
    return this.state.entriesLength;
  }
}
