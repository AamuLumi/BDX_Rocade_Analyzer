import {
    REQUEST_PARTS,
    RECEIVE_PARTS
} from '~/actions/Rocade';

export function loadParts(state = {
    isFetching: false,
    parts: []
}, action) {
    switch (action.type) {
        case REQUEST_PARTS:
            return Object.assign({}, state, {
                isFetching: true
            });
        case RECEIVE_PARTS:
            return Object.assign({}, state, {
                isFetching: false,
                parts: action.parts,
                lastUpdated : action.receivedAt
            });
        default:
            return state;
    }
}
