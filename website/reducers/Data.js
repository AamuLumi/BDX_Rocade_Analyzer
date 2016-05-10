import {
    VIEWER_LOADING,
    VIEWER_LOADED,
    UPCHART_LOADING,
    UPCHART_LOADED,
    DOWNCHART_LOADING,
    DOWNCHART_LOADED
} from '~/actions/Data';

function data(state = {
    isFetching: false,
    data: []
}, action, actions) {
    switch (action.type) {
        case actions.LOADING:
            return Object.assign({}, state, {
                isFetching: true
            });
        case actions.LOADED:
            console.log(action);
            return {
                isFetching: false,
                data: action.data,
                lastUpdated: new Date()
            };
        default:
            return state;
    }
}

export function viewerData(state, action) {
    return data(state, action, {
        LOADING: VIEWER_LOADING,
        LOADED: VIEWER_LOADED
    });;
}

export function upChartData(state, action) {
    return data(state, action, {
        LOADING: UPCHART_LOADING,
        LOADED: UPCHART_LOADED
    });
}

export function downChartData(state, action) {
    return data(state, action, {
        LOADING: DOWNCHART_LOADING,
        LOADED: DOWNCHART_LOADED
    });
}
