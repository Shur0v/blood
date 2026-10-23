export const DISCOVERY_RESULT_EVENT='bloodnet:discovery-result';
export type DiscoverySnapshot={kind:'blood'|'organ'|'request';country:string;scope:'local'|'country'|'global';count:number;empty:boolean;filtersRetained:true;broader?:boolean};
const snapshots=new Map<string,DiscoverySnapshot>();
export function discoverySnapshot(endpoint:string,params:URLSearchParams,count:number):DiscoverySnapshot{return {kind:endpoint.endsWith('organ-requests')?'request':endpoint.endsWith('organ-donors')?'organ':'blood',country:params.get(endpoint.endsWith('organ-requests')?'viewerCountry':'country')||'',scope:params.has(endpoint.endsWith('organ-requests')?'viewerCountry':'country')?(params.has('search')?'local':'country'):'global',count,empty:count===0,filtersRetained:true,...(params.get('expand')==='nearby'?{broader:true}:{})};}
export function publishDiscoverySnapshot(snapshot:DiscoverySnapshot){if(typeof window==='undefined')return;snapshots.set(snapshot.kind,snapshot);window.dispatchEvent(new CustomEvent(DISCOVERY_RESULT_EVENT,{detail:snapshot}));}
export function readDiscoverySnapshots(){return [...snapshots.values()];}
