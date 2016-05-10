import {
    REQUEST_PARTS_BY_DATE,
    RECEIVE_PARTS_BY_DATE,
    REQUEST_PARTS_BY_PART,
    RECEIVE_PARTS_BY_PART
} from '~/app/actions/Rocade';

export function partsByDate(state = {
    isFetching: false,
    parts: []
}, action) {
    switch (action.type) {
        case REQUEST_PARTS_BY_DATE:
            return Object.assign({}, state, {
                isFetching: true
            });
        case RECEIVE_PARTS_BY_DATE:
            return Object.assign({}, state, {
                isFetching: false,
                parts: action.parts,
                lastUpdated : action.receivedAt
            });
        default:
            return state;
    }
}

export function partsByPart(state = {
    isFetching: false,
    parts: []
}, action) {
    switch (action.type) {
        case REQUEST_PARTS_BY_PART:
            return Object.assign({}, state, {
                isFetching: true
            });
        case RECEIVE_PARTS_BY_PART:
            return Object.assign({}, state, {
                isFetching: false,
                parts: action.parts,
                lastUpdated : action.receivedAt
            });
        default:
            return state;
    }
}
