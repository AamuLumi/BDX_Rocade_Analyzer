import React, { Component } from 'react';

import RocadeViewer from './components/RocadeViewer';
import ControlPanel from './components/ControlPanel';
import './App.less';

export default class App extends Component {
  render() {
    return (
      <div id="v-app">
        <RocadeViewer/>
        <ControlPanel/>
      </div>
    );
  }
}
