import 'babel-polyfill';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import App from './app';
import {Provider} from 'react-redux';
import Store from './reducers';

export default class Root extends Component {
  render() {
    return (
      <Router history={browserHistory}>
        <IndexRoute path="/" component={App}></IndexRoute>
      </Router>
    );
  }
}

ReactDOM.render(
  <Provider store={Store}><App/></Provider>, document.getElementById('app'));
