import fetch from 'isomorphic-fetch';

export const REQUEST_PARTS = 'REQUEST_PARTS';
export const RECEIVE_PARTS = 'RECEIVE_PARTS';

export function requestParts(request) {
    return {
        type: REQUEST_PARTS,
        request
    };
}

export function receiveParts(json) {
    return {
        type: RECEIVE_PARTS,
        parts: json,
        receivedAt: Date.now()
    };
}

function fetchParts(request) {
    let body = JSON.stringify(request);

    return function(dispatch) {
        dispatch(requestParts(request));

        return fetch('http://localhost:9900/request', {
                method: 'POST',
                headers: {
                  'Content-Type' : 'application/json'
                },
                body: body
            })
            .then((response) => {
                return response.json();
            })
            .then((json) => dispatch(receiveParts(json)));
    };
}

function shouldFetchParts(state, request) {
    const parts = state.loadParts;

    if (!parts.lastUpdated || request) {
        return true;
    } else {
        return false;
    }
}

export function fetchPartsIfNeeded(request) {
    return (dispatch, getState) => {
        if (shouldFetchParts(getState(), request)) {
            return dispatch(fetchParts(request));
        } else {
            return Promise.resolve();
        }
    };
}
