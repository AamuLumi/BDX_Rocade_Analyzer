import fetch from 'isomorphic-fetch';
import DateStorage from '~/tools/DateStorage';

export const VIEWER_LOADING = 'VIEWER_LOADING';
export const VIEWER_LOADED = 'VIEWER_LOADED';
export const UPCHART_LOADING = 'UPCHART_LOADING';
export const UPCHART_LOADED = 'UPCHART_LOADED';
export const DOWNCHART_LOADING = 'DOWNCHART_LOADING';
export const DOWNCHART_LOADED = 'DOWNCHART_LOADED';

const url = 'http://localhost:9900/searchByPart';

function fetchDatas(req, missingReq, actions, requestFn) {
    let body = JSON.stringify(missingReq);

    return function(dispatch) {
        dispatch(actions.loading(missingReq));

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
            .then((json) => {
                DateStorage.addArray(json, '_id', req);
            })
            .then(() => {
                return dispatch(requestFn(req, actions, true));
            });
    };
}

export function request(req, actions, calledAfterFetch) {
    return (dispatch) => {
        let {
            res,
            missing
        } = DateStorage.get(req);

        if (missing.length > 0 && !calledAfterFetch) {
            return dispatch(fetchDatas(req, {
                timeslots: missing
            }, actions, request));
        } else {
            return dispatch(actions.loaded(res));
        }
    };
}

export function loadDataForViewer(req) {
    return (dispatch) => {
        return dispatch(request(req, {
            loading: () => {
                return {
                    type: VIEWER_LOADING
                };
            },
            loaded: (res) => {
                return {
                    type: VIEWER_LOADED,
                    data: res
                };
            }
        }));
    };
}

export function loadDataForUpChart(req) {
    return (dispatch) => {
        return dispatch(request(req, {
            loading: () => {
                return {
                    type: UPCHART_LOADING
                };
            },
            loaded: (res) => {
                return {
                    type: UPCHART_LOADED,
                    data: res
                };
            }
        }));
    };
}

export function loadDataForDownChart(req) {
    return (dispatch) => {
        return dispatch(request(req, {
            loading: () => {
                return {
                    type: DOWNCHART_LOADING
                };
            },
            loaded: (res) => {
                return {
                    type: DOWNCHART_LOADED,
                    data: res
                };
            }
        }));
    };
}
