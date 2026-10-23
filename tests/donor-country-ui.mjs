import assert from 'node:assert/strict';import {createRequire} from 'node:module';import path from 'node:path';
const {JSDOM}=createRequire(path.resolve(process.env.BLOODNET_UI_TEST_PACKAGE||'package.json'))('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','localStorage'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {default:React,act}=await import('react');globalThis.React=React;
const {createRoot}=await import('react-dom/client');
const {default:CountryFilter}=await import('../src/components/DonorCountryFilter.tsx');
const {default:useDonorRegion}=await import('../src/components/useDonorRegion');
let countries=['Bangladesh','India'];let counts={Bangladesh:1234,India:56};let fail=false;let reads=0;
globalThis.fetch=async input=>{
 if(String(input).includes('/api/location/ip'))return Response.json({success:true,data:{country:'Bangladesh'}});
 reads++;if(fail)throw Error('Synthetic outage');return Response.json({success:true,data:countries,counts});
};
function Probe(){const region=useDonorRegion();return React.createElement('div',{'data-country':region.country},React.createElement(CountryFilter,{country:region.country,onChange:region.chooseCountry}));}
localStorage.setItem('bloodnet_donor_country_v1','Anguilla');
const root=createRoot(document.getElementById('root'));
await act(async()=>{root.render(React.createElement(Probe));await new Promise(resolve=>setTimeout(resolve,30));});
await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30));});
const options=()=>[...document.querySelectorAll('option')].filter(option=>option.value).map(option=>option.value);
assert.deepEqual(options(),countries);assert.equal(document.querySelector('[data-country]').dataset.country,'Bangladesh');assert.equal(localStorage.getItem('bloodnet_donor_country_v1'),null);assert.equal(reads,1,'Multiple consumers share one coverage fetch');
const labels=()=>[...document.querySelectorAll('option')].filter(option=>option.value).map(option=>option.textContent);
assert.deepEqual(labels(),['Bangladesh (1,234)','India (56)']);
await act(async()=>{const select=document.querySelector('select');select.value='India';select.dispatchEvent(new Event('change',{bubbles:true}));});
assert.equal(document.querySelector('[data-country]').dataset.country,'India');assert.equal(localStorage.getItem('bloodnet_donor_country_v1'),'India','Selection stores the country name without the displayed count');
const now=Date.now;try{
 countries=['Bangladesh','India','Nepal'];counts={Bangladesh:1235,India:56,Nepal:1};Date.now=()=>now()+16000;
 await act(async()=>{window.dispatchEvent(new Event('focus'));await new Promise(resolve=>setTimeout(resolve,30));});
 assert.deepEqual(options(),countries,'New registrations refresh the dropdown without a deployment');
 assert.deepEqual(labels(),['Bangladesh (1,235)','India (56)','Nepal (1)']);
 fail=true;Date.now=()=>now()+32000;
 await act(async()=>{window.dispatchEvent(new Event('focus'));await new Promise(resolve=>setTimeout(resolve,30));});
 assert.deepEqual(options(),countries,'A refresh failure retains known coverage instead of inventing countries');
 assert.deepEqual(labels(),['Bangladesh (1,235)','India (56)','Nepal (1)'],'A refresh failure preserves previously confirmed counts');
}finally{Date.now=now;}
await act(async()=>root.unmount());dom.window.close();
console.log('Donor country UI passed: database-only options, invalid preference recovery, shared fetch, new-country refresh and outage preservation.');
