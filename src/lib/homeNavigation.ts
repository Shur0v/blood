// Use a document navigation even when already on Home. This resets temporary
// filters and bypasses the client router's previously mounted homepage state.
export function openFreshHome(location:Pick<Location,'assign'>=window.location){
  location.assign('/');
}
