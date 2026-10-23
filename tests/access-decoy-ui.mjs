import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
const {JSDOM}=createRequire(path.resolve(process.env.BLOODNET_UI_TEST_PACKAGE||'package.json'))('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'https://example.invalid/admin-dashboard',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {default:React,act}=await import('react');const {createRoot}=await import('react-dom/client');
const {default:Decoy,DECOY_DELAY_MS}=await import('../src/components/LegacyAccessDecoy');
const originalTimer=globalThis.setTimeout,originalClear=globalThis.clearTimeout,originalFetch=globalThis.fetch;
let finish,delay,cleared=false,network=0;
globalThis.setTimeout=(callback,ms,...args)=>{if(ms===DECOY_DELAY_MS){finish=callback;delay=ms;return 987654;}return originalTimer(callback,ms,...args);};
globalThis.clearTimeout=id=>{if(id===987654)cleared=true;else originalClear(id);};
globalThis.fetch=async()=>{network++;throw Error('Decoy must not send credentials.');};
const root=createRoot(document.getElementById('root'));
try{
 await act(async()=>root.render(React.createElement(Decoy)));
 const fields=[...document.querySelectorAll('input')];fields[0].value='arbitrary-id';fields[1].value='arbitrary-password';
 await act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 assert.equal(delay,150000);assert.equal(network,0);assert.ok(fields.every(field=>field.value===''&&field.disabled));
 assert.match(document.querySelector('button').textContent,/Checking access/);assert.equal(document.querySelector('[role="status"]').textContent,'');
 await act(async()=>finish());assert.equal(document.querySelector('[role="status"]').textContent,'Access denied.');assert.equal(network,0);
 await act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 await act(async()=>root.unmount());assert.equal(cleared,true,'Leaving the decoy cancels its pending timer');
 console.log('Decoy passed: 150-second client delay, cleared fields, denied access, zero network calls and timer cleanup.');
}finally{globalThis.setTimeout=originalTimer;globalThis.clearTimeout=originalClear;globalThis.fetch=originalFetch;dom.window.close();}
