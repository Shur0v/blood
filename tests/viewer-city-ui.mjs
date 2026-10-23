import assert from 'node:assert/strict';import {createRequire} from 'node:module';import path from 'node:path';
const {JSDOM}=createRequire(path.resolve(process.env.BLOODNET_UI_TEST_PACKAGE||'package.json'))('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});for(const key of ['window','document','HTMLElement','Element','Node','Event','CustomEvent'])globalThis[key]=dom.window[key];
let gpsCalls=0;Object.defineProperty(globalThis,'navigator',{value:{geolocation:{getCurrentPosition(){gpsCalls++;}},language:'en-BD',userAgent:'jsdom'},configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {default:React,act}=await import('react');const {createRoot}=await import('react-dom/client');const {default:useViewerGeo}=await import('../src/components/useViewerGeo');
let finishCity;const requests=[];
globalThis.fetch=async input=>{requests.push(String(input));return String(input).includes('detail=city')?new Promise(resolve=>{finishCity=resolve;}):Response.json({success:true,data:{country:'Bangladesh'}});};
function Probe({id}){const geo=useViewerGeo();return React.createElement('div',{id,'data-country':geo.country||'','data-city':geo.city||''});}
const root=createRoot(document.getElementById('root'));
await act(async()=>{root.render(React.createElement(React.Fragment,null,React.createElement(Probe,{id:'one'}),React.createElement(Probe,{id:'two'})));await new Promise(resolve=>setTimeout(resolve,20));});
await act(async()=>{await new Promise(resolve=>setTimeout(resolve,20));});
assert.equal(document.getElementById('one').dataset.country,'Bangladesh');assert.equal(document.getElementById('one').dataset.city,'');assert.equal(requests.length,2,'All consumers share one fast country request and one background city request');
await act(async()=>{finishCity(Response.json({success:true,data:{country:'Bangladesh',city:'Dhaka',lat:23.8,lng:90.4}}));await new Promise(resolve=>setTimeout(resolve,20));});
assert.equal(document.getElementById('one').dataset.city,'Dhaka');assert.equal(document.getElementById('two').dataset.city,'Dhaka');assert.equal(gpsCalls,0,'Automatic browsing never requests device permission');
await act(async()=>root.unmount());dom.window.close();console.log('Viewer city passed: fast country browsing, shared asynchronous city upgrade and no GPS permission prompt.');
