export const SAVE_VIEWER = 'SAVE_VIEWER';
export const LOAD_VIEWER = 'LOAD_VIEWER';

export function saveViewer(state){
  return {
    type : SAVE_VIEWER,
    state : state
  };
}

export function loadViewer(){
  return {
    type : LOAD_VIEWER
  };
}
