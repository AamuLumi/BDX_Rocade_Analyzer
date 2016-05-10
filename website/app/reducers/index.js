import {
    combineReducers,
    applyMiddleware,
    createStore
} from 'redux';
import thunkMiddleware from 'redux-thunk';

import {
    partsByDate,
    partsByPart
} from './Rocade';

import {
  getViewer
} from './RocadeViewer';

import {
  data,
  viewerData,
  upChartData,
  downChartData
} from './Data';

export default createStore(combineReducers({
    partsByDate,
    partsByPart,
    getViewer,
    data,
    viewerData,
    upChartData,
    downChartData
}), applyMiddleware(thunkMiddleware));
