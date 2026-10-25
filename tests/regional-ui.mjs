import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const load=createRequire(path.resolve(process.env.BLOODNET_UI_TEST_PACKAGE||'package.json'));
const {JSDOM}=load('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','SVGElement','Node','Event','MouseEvent','CustomEvent','MutationObserver','FormData'])globalThis[key]=dom.window[key];
globalThis.self=dom.window;Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let copied='';Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{copied=text;}},configurable:true});
const {default:React,act}=await import('react');globalThis.React=React;
const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
const {RegionalGallery,RegionalRequestBuilder}=await import(pathToFileURL(process.cwd()+'/src/components/regional/RegionalInteractions.tsx'));
const {default:Visibility}=await import(pathToFileURL(process.cwd()+'/src/components/CityRequestVisibilityControl.tsx'));
const {default:Editor}=await import(pathToFileURL(process.cwd()+'/src/components/RegionalContentEditor.tsx'));
const {default:DonorModal}=await import(pathToFileURL(process.cwd()+'/src/components/DonorModal.tsx'));
const {default:AuthModal}=await import(pathToFileURL(process.cwd()+'/src/components/AuthModal.tsx'));
const first={assetId:'00000000-0000-4000-8000-000000000001',alt:'Synthetic community image',caption:'A reviewed photo',credit:'Test fixture',sourceUrl:'',eventDate:'',url:'https://example.invalid/a.webp',width:1200,height:800};
await act(async()=>root.render(React.createElement(RegionalGallery,{content:{title:'Local update',summary:'Public information',updatedAt:'2026-10-25',slides:[first,{...first,assetId:'00000000-0000-4000-8000-000000000002'}]}})));
assert.equal(document.querySelectorAll('figure[aria-hidden="false"]').length,1);
await act(async()=>document.querySelector('[aria-label="Next regional image"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
assert.equal(document.querySelector('[aria-live="polite"]').textContent,'2 / 2');
await act(async()=>document.querySelector('[aria-label="Previous regional image"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
assert.equal(document.querySelector('[aria-live="polite"]').textContent,'1 / 2');

let flag=false;const updates=[];
const record={key:'nepal:*',country:'Nepal',city:null,title:'Existing Nepal update',summary:'A saved community description.',slides:[Object.fromEntries(Object.entries(first).filter(([key])=>!['url','width','height'].includes(key)))],published:true};
globalThis.fetch=async(url,init={})=>{
 if(String(url)==='/api/admin/site-controls'){
  if(init.method==='PATCH')flag=JSON.parse(init.body).cityDonationRequestVisible;
  return Response.json({success:true,data:{cityDonationRequestVisible:flag,patientIdVisible:false,discoveryVisible:true}});
 }
 if(String(url)==='/api/admin/regional-content'){
  if(init.method==='PUT'){updates.push(JSON.parse(init.body));return Response.json({success:true,data:{...updates.at(-1),key:'nepal:*'}});}
  return Response.json({success:true,data:{records:[record],assets:[{id:first.assetId,public_url:first.url}],locations:[{country:'Nepal',city:'Kathmandu'},{country:'Nepal',city:'Pokhara'},{country:'India',city:'Chennai'}]}});
 }
 if(String(url)==='/api/uploads/image')return Response.json({success:true,data:{id:'00000000-0000-4000-8000-000000000003',url:'https://example.invalid/new.webp'}});
 return Response.json({success:true,data:{country:'Nepal'}});
};
await act(async()=>root.render(React.createElement(React.Fragment,null,React.createElement(Visibility),React.createElement(RegionalRequestBuilder,{city:'Kathmandu',group:'A+'}))));
assert.equal(document.querySelector('[data-region-section="6"]'),null);
await act(async()=>document.querySelector('[role="switch"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
// Request preparation is fetched only after the administrator enables it.
for(let attempt=0;attempt<40&&!document.querySelector('[data-region-section="6"]');attempt++)await act(async()=>new Promise(resolve=>setTimeout(resolve,50)));
assert.equal(document.querySelector('[role="switch"]').getAttribute('aria-checked'),'true');assert.ok(document.querySelector('[data-region-section="6"]'));
await act(async()=>[...document.querySelectorAll('button')].find(el=>el.textContent.includes('Copy message')).dispatchEvent(new MouseEvent('click',{bubbles:true})));
assert.match(copied,/Kathmandu/);assert.match(copied,/A\+/);
await act(async()=>document.querySelector('[role="switch"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
assert.equal(document.querySelector('[data-region-section="6"]'),null);

let closed=0;
await act(async()=>root.render(React.createElement(DonorModal,{donor:{name:'Synthetic Nepal volunteer',phone:'+977000000000',group:'A+',location:'Kathmandu, Nepal'},onClose:()=>closed++})));
assert.equal(document.activeElement.getAttribute('aria-label'),'Close donor details');
await act(async()=>document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
assert.equal(closed,1);
await act(async()=>root.render(React.createElement(Editor)));
await act(async()=>{const details=document.querySelector('details');details.open=true;details.dispatchEvent(new Event('toggle',{bubbles:true}));});
assert.ok([...document.querySelectorAll('input')].some(el=>el.value===record.title),'Load the existing country update, rather than a blank draft');
assert.equal(document.querySelector('img').src,first.url);
await act(async()=>[...document.querySelectorAll('button')].find(el=>el.textContent==='Save regional content').dispatchEvent(new MouseEvent('click',{bubbles:true})));
assert.equal(updates.length,1);assert.equal(updates[0].key,undefined);assert.equal(updates[0].published,true);
await act(async()=>{const select=document.querySelectorAll('select')[1];select.value='Pokhara';select.dispatchEvent(new Event('change',{bubbles:true}));});
assert.equal([...document.querySelectorAll('input')].find(el=>el.maxLength===140).value,'');
await act(async()=>{const select=document.querySelectorAll('select')[0];select.value='India';select.dispatchEvent(new Event('change',{bubbles:true}));});
assert.equal(document.querySelector('input[type="checkbox"]').disabled,false,'Publishing is available for recorded countries beyond Nepal');

await act(async()=>root.render(React.createElement(AuthModal,{key:'login',isOpen:true,initialMode:'login',onClose(){},onSuccess(){}})));
assert.match(document.querySelector('[role="dialog"]').textContent,/Login to BloodNet/);
await act(async()=>root.render(React.createElement(AuthModal,{key:'register',isOpen:true,onClose(){},onSuccess(){}})));
assert.match(document.querySelector('[role="dialog"]').textContent,/Join BloodNet/);
await act(async()=>root.unmount());dom.window.close();
console.log('Regional UI passed: slider navigation, live request visibility, copying, saved-content loading, city selection and both auth modes.');
