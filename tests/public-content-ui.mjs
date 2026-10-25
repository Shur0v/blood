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
globalThis.IntersectionObserver=class {observe(){} unobserve(){} disconnect(){}};window.IntersectionObserver=globalThis.IntersectionObserver;


const {default:React,act}=await import('react');globalThis.React=React;
const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
const {default:Picker}=await import(pathToFileURL(process.cwd()+'/src/components/ManagedImagePicker.tsx'));
const {default:Editor}=await import(pathToFileURL(process.cwd()+'/src/components/PublicContentEditor.tsx'));
const image={id:'00000000-0000-4000-8000-000000000001',url:'https://example.invalid/community.webp',width:800,height:400,variants:[],metadata:{filename:'community-event',credit:'Test creator',sourcePage:'',licenseUrl:'',rightsConfirmed:true}};
const updates=[];globalThis.fetch=async(url,init={})=>{if(init.method==='PUT'){const value=JSON.parse(init.body);updates.push(value);return Response.json({success:true,data:{...value,draft:value.content||value.availability}});}if(String(url).includes('public-images'))return Response.json({success:true,data:[image],pagination:{nextCursor:null}});if(String(url).endsWith('service-availability'))return Response.json({success:true,data:{records:[],locations:[{country:'Nepal',city:'Kathmandu'}]}});if(String(url).endsWith('platform-outcomes'))return Response.json({success:true,data:{registeredAccounts:20,profilesWithRecords:5,acceptedPartnerPrescriptions:3,prescriptionEmailsDelivered:2}});return Response.json({success:true,data:[]});};
const click=async text=>act(async()=>[...document.querySelectorAll('button')].find(node=>node.textContent===text).click());
const open=async()=>act(async()=>{const el=document.querySelector('details');el.open=true;el.dispatchEvent(new Event('toggle',{bubbles:true}));});
let placement=null;await act(async()=>root.render(React.createElement(Picker,{value:{assetId:image.id,alt:'An actual community event',caption:'',decorative:false},onChange:value=>{placement=value;}})));await open();
await act(async()=>{const select=document.querySelector('select');select.value='reuse';select.dispatchEvent(new Event('change',{bubbles:true}));});
await act(async()=>{const select=document.querySelectorAll('select')[1];select.value=image.id;select.dispatchEvent(new Event('change',{bubbles:true}));});
assert.ok(document.querySelector('img'));await click('Attach image to form');assert.equal(placement.assetId,image.id);assert.equal(placement.alt,'An actual community event');assert.match(document.querySelector('[role=status]').textContent,/Save or publish/);
await act(async()=>root.render(React.createElement(Editor)));await open();assert.ok(document.body.textContent.includes('Profiles with records'));await click('Save page draft');assert.equal(updates.at(-1).action,'draft');assert.equal(updates.at(-1).key,'medical-profile');await click('Publish page content');assert.equal(updates.at(-1).action,'publish');await click('Save availability draft');assert.equal(updates.at(-1).country,'Nepal');assert.equal(updates.at(-1).availability.booking,null);await click('Restore default page content');assert.equal(updates.at(-1).action,'restore');await act(async()=>root.unmount());dom.window.close();console.log('Public image reuse, attachment, private drafts, content publication and regional availability UI passed.');
