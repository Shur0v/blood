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
const {default:Editor}=await import(pathToFileURL(process.cwd()+'/src/components/HomepageContentEditor.tsx'));
const {HomepageContentProvider,HomeText,HomeSectionVisibility}=await import(pathToFileURL(process.cwd()+'/src/components/HomepageContentContext.tsx'));
const updates=[];globalThis.fetch=async(url,init={})=>{assert.equal(url,'/api/admin/homepage-content');if(init.method==='PUT'){const value=JSON.parse(init.body);updates.push(value);return Response.json({success:true,data:{draft:value.action==='restore'?{}:value.config}});}return Response.json({success:true,data:{draft:{copy:{heroHeading:'Draft headline'},hiddenSections:[]}}});};
await act(async()=>root.render(React.createElement(Editor)));
await act(async()=>{const details=document.querySelector('details');details.open=true;details.dispatchEvent(new Event('toggle',{bubbles:true}));});
assert.equal(document.querySelector('textarea').value,'Draft headline');
await act(async()=>document.querySelector('input[type=checkbox]').click());
const button=text=>[...document.querySelectorAll('button')].find(node=>node.textContent===text);
await act(async()=>button('Save draft').click());assert.equal(updates.at(-1).action,'draft');assert.deepEqual(updates.at(-1).config.hiddenSections,['process']);assert.match(document.querySelector('[role=status]').textContent,/has not changed/);
await act(async()=>button('Publish homepage').click());assert.equal(updates.at(-1).action,'publish');
await act(async()=>button('Reset draft to original').click());assert.equal(document.querySelector('textarea').value,'');assert.equal(document.querySelector('input').checked,true);assert.equal(updates.length,2,'Reset form does not publish');
await act(async()=>button('Publish original homepage').click());assert.equal(updates.at(-1).action,'restore');
for(const value of [null,{copy:{ctaTitle:'Customized invitation'},hiddenSections:['faq']}]){
 await act(async()=>root.render(React.createElement(HomepageContentProvider,{value},React.createElement(HomeText,{name:'ctaTitle'},React.createElement('span',null,'Original invitation')),React.createElement(HomeSectionVisibility,{name:'faq'},React.createElement('p',null,'Questions')))));
 if(value){assert.match(document.body.textContent,/Customized invitation/);assert.equal(document.querySelector('p'),null);}else{assert.equal(document.querySelector('span').textContent,'Original invitation');assert.equal(document.querySelector('p').textContent,'Questions');}
}
const {default:CTA}=await import(pathToFileURL(process.cwd()+'/src/components/CTA.tsx'));
let registrations=0;
await act(async()=>root.render(React.createElement(HomepageContentProvider,{value:{copy:{ctaTitle:'A new invitation',ctaButton:'Join locally'},hiddenSections:[]}},React.createElement(CTA,{onSignUpClick:()=>registrations++}))));
assert.equal(document.querySelectorAll('h2 br').length,1,'Custom title keeps the invitation line break');
await act(async()=>[...document.querySelectorAll('button')].find(node=>node.textContent.includes('Join locally')).click());assert.equal(registrations,1);
await act(async()=>root.unmount());dom.window.close();console.log('Homepage editor draft, publish, restore and default content UI checks passed.');
