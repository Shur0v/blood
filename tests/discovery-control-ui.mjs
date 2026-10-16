import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
const load=createRequire(path.resolve(process.env.BLOODNET_UI_TEST_PACKAGE||'package.json'));
const {JSDOM}=load('jsdom');
import {pathToFileURL} from 'node:url';
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','SVGElement','Node','Event','MouseEvent','MutationObserver'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {default:React,act}=await import(pathToFileURL(process.cwd()+'/node_modules/react/index.js'));
globalThis.React=React;
const {createRoot}=await import(pathToFileURL(process.cwd()+'/node_modules/react-dom/client.js'));



globalThis.CustomEvent=window.CustomEvent;globalThis.localStorage=window.localStorage;
let liveStream;globalThis.EventSource=class {constructor(url){this.url=url;liveStream=this;}close(){this.closed=true;}};
const {default:Runtime}=await import(pathToFileURL(process.cwd()+'/src/components/PublicUiControlsSync.tsx'));
const {default:Control}=await import(pathToFileURL(process.cwd()+'/src/components/DiscoveryVisibilityControl.tsx'));
let requests=[],value=true;globalThis.fetch=async(url,init={})=>{requests.push({url:String(url),method:init.method||'GET'});if(init.body)value=JSON.parse(init.body).discoveryVisible;return Response.json({success:true,data:{discoveryVisible:value}});};
const root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(React.Fragment,null,React.createElement(Control),React.createElement(Runtime))));
assert.equal(requests.length,1);assert.equal(document.querySelector('[role=switch]').getAttribute('aria-checked'),'true');
await act(async()=>document.querySelector('button').dispatchEvent(new MouseEvent('click',{bubbles:true})));assert.equal(value,false);assert.equal(document.documentElement.getAttribute('data-discovery-visible'),'false');assert.equal(requests[1].url,'/api/admin/site-controls');
await act(async()=>document.querySelector('button').dispatchEvent(new MouseEvent('click',{bubbles:true})));assert.equal(value,true);assert.equal(document.documentElement.getAttribute('data-discovery-visible'),'true');assert.ok(requests.every(r=>!r.url.includes('ads-settings')));
await act(async()=>liveStream.onmessage({data:JSON.stringify({discoveryVisible:false})}));assert.equal(document.documentElement.getAttribute('data-discovery-visible'),'false');assert.equal(liveStream.url,'/api/public/ui-events');
console.log('PASS independent discovery toggle saves immediately and publishes cross-tab state without ad requests');
await act(async()=>root.unmount());assert.equal(liveStream.closed,true);dom.window.close();
