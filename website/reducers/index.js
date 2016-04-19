import {
    combineReducers,
    applyMiddleware,
    createStore
} from 'redux';
import thunkMiddleware from 'redux-thunk';

import {
    loadParts
} from './Rocade';

export default createStore(combineReducers({
    loadParts
}), applyMiddleware(thunkMiddleware));
