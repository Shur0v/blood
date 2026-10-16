export const UI_CONTROLS_EVENT='bloodnet:ui-controls';
export const UI_CONTROLS_STORAGE='bloodnet.ui-controls';
export function applyPublicUiControls(value:{discoveryVisible:boolean}){
  document.documentElement.setAttribute('data-discovery-visible',String(value.discoveryVisible));
  window.dispatchEvent(new CustomEvent(UI_CONTROLS_EVENT,{detail:value}));
}
export function publishPublicUiControls(value:{discoveryVisible:boolean}){
  applyPublicUiControls(value);try{localStorage.setItem(UI_CONTROLS_STORAGE,JSON.stringify(value));}catch{/* Live server updates still apply. */}
}
