import fetch from 'isomorphic-fetch';

export const REQUEST_PARTS_BY_DATE = 'REQUEST_PARTS_BY_DATE';
export const RECEIVE_PARTS_BY_DATE = 'RECEIVE_PARTS_BY_DATE';
export const REQUEST_PARTS_BY_PART = 'REQUEST_PARTS_BY_PART';
export const RECEIVE_PARTS_BY_PART = 'RECEIVE_PARTS_BY_PART';

// Global

function fetchParts(request, url, requestMethod, receiveMethod) {
    let body = JSON.stringify(request);

    return function(dispatch) {
        dispatch(requestMethod(request));

        return fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body
            })
            .then((response) => {
                return response.json();
            })
            .then((json) => dispatch(receiveMethod(json)));
    };
}

// Parts by date

export function requestPartsByDate(request) {
    return {
        type: REQUEST_PARTS_BY_DATE,
        request
    };
}

export function receivePartsByDate(json) {
    return {
        type: RECEIVE_PARTS_BY_DATE,
        parts: json,
        receivedAt: Date.now()
    };
}

function fetchPartsByDate(request) {
    return fetchParts(request,
        'http://localhost:9900/searchByDate',
        requestPartsByDate, receivePartsByDate);
}

function shouldFetchPartsByDate(state, request) {
    const parts = state.partsByDate;

    if (!parts.lastUpdated || request) {
        return true;
    } else {
        return false;
    }
}

export function fetchPartsByDateIfNeeded(request) {
    return (dispatch, getState) => {
        if (shouldFetchPartsByDate(getState(), request)) {
            return dispatch(fetchPartsByDate(request));
        } else {
            return Promise.resolve();
        }
    };
}

// Parts by parts

export function requestPartsByPart(request) {
    return {
        type: REQUEST_PARTS_BY_PART,
        request
    };
}

export function receivePartsByPart(json) {
    return {
        type: RECEIVE_PARTS_BY_PART,
        parts: json,
        receivedAt: Date.now()
    };
}

function fetchPartsByPart(request) {
    return fetchParts(request,
        'http://localhost:9900/searchByPart',
        requestPartsByPart,
        receivePartsByPart);
}

function shouldFetchPartsByPart(state, request) {
    const parts = state.partsByPart;

    if (!parts.lastUpdated || request) {
        return true;
    } else {
        return false;
    }
}

export function fetchPartsByPartIfNeeded(request) {
    return (dispatch, getState) => {
        if (shouldFetchPartsByPart(getState(), request)) {
            return dispatch(fetchPartsByPart(request));
        } else {
            return Promise.resolve();
        }
    };
}
