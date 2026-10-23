export const UI_CONTROLS_EVENT='bloodnet:ui-controls';
export const UI_CONTROLS_STORAGE='bloodnet.ui-controls';
export type PublicUiControls={discoveryVisible?:boolean;patientIdVisible?:boolean};
export function applyPublicUiControls(value:PublicUiControls){
  if(typeof value.discoveryVisible==='boolean')document.documentElement.setAttribute('data-discovery-visible',String(value.discoveryVisible));
  if(typeof value.patientIdVisible==='boolean')document.documentElement.setAttribute('data-patient-id-visible',String(value.patientIdVisible));
  window.dispatchEvent(new CustomEvent(UI_CONTROLS_EVENT,{detail:value}));
}
export function publishPublicUiControls(value:PublicUiControls){
  applyPublicUiControls(value);try{localStorage.setItem(UI_CONTROLS_STORAGE,JSON.stringify(value));}catch{/* Live server updates still apply. */}
}
