import 'babel-polyfill';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import App from './app';
import {Provider} from 'react-redux';
import PartViewer from './app/components/PartViewer';
import RocadeViewer from './app/components/RocadeViewer';
import Store from './app/reducers';

export default class Root extends Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route path="/" component={App}>
          <IndexRoute component={RocadeViewer} />
          <Route path="part/:id" component={PartViewer} />
        </Route>
      </Router>
    );
  }
}

ReactDOM.render(
  <Provider store={Store}><Root/></Provider>, document.getElementById('app'));
