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

export default createStore(combineReducers({
    partsByDate,
    partsByPart,
    getViewer
}), applyMiddleware(thunkMiddleware));
