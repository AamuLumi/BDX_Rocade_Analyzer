import {
    SAVE_VIEWER,
    LOAD_VIEWER
} from '~/app/actions/RocadeViewer';

export function getViewer(state = {}, action){
  switch(action.type){
    case SAVE_VIEWER :
      return action.state;
    case LOAD_VIEWER :
    default :
      return state;
  }
}
