import React, { Component } from 'react';

import ControlPanel from './components/ControlPanel';
import './App.less';

export default class App extends Component {
  render() {
    return (
      <div id="v-app">
        {this.props.children}
        <ControlPanel/>
      </div>
    );
  }
}
