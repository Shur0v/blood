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

const {default:AuthModal}=await import(pathToFileURL(process.cwd()+'/src/components/AuthModal.tsx'));
globalThis.screen=window.screen;globalThis.localStorage=window.localStorage;
const root=createRoot(document.getElementById('root'));let requests=[],resultCode='',lateConflict=false,successes=0;
const city={city:'Dhaka',country:'Bangladesh',formatted_location:'Dhaka, Bangladesh',latitude:23.81,longitude:90.41,provider_place_id:'test-dhaka',token:'test-location-proof'};
globalThis.fetch=async(url,init={})=>{if(String(url).includes('/location/cities'))return Response.json({success:true,data:[city]});requests.push({url:String(url),body:JSON.parse(init.body)});if(resultCode==='EXISTING_ACCOUNT')return Response.json(String(url).endsWith('/request')?{existingAccount:true,mode:'login',message:'This email already has an account. Enter the code to access your existing account.'}:{user:{id:'original-account',name:'Existing donor'}});if(lateConflict&&String(url).endsWith('/request'))return Response.json({message:'OTP dispatched'});const error=resultCode==='EMAIL_ALREADY_REGISTERED'?'This email address is already registered. Please log in instead.':resultCode==='PHONE_ALREADY_REGISTERED'?'This phone number is already linked to an account. Please log in with your registered email address.':'Too many attempts. Please try again later.';return Response.json(resultCode==='RATE_LIMIT'?{message:error}:{error,code:resultCode},{status:resultCode==='RATE_LIMIT'?429:409});};
const click=async el=>{assert.ok(el);await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));};
const button=text=>Array.from(document.querySelectorAll('button')).find(el=>el.textContent.trim()===text);
const fill=async(el,value)=>{assert.ok(el);await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});};
for(const [code,late] of [['EMAIL_ALREADY_REGISTERED',false],['PHONE_ALREADY_REGISTERED',false],['PHONE_ALREADY_REGISTERED',true],['RATE_LIMIT',false],['EXISTING_ACCOUNT',false]]){
 resultCode=code;lateConflict=late;requests=[];
 await act(async()=>root.render(React.createElement(AuthModal,{key:code+late,isOpen:true,onClose(){},onSuccess(){successes++;}})));
 await fill(document.getElementById('auth-name'),'Synthetic Registration Test');await fill(document.getElementById('auth-email'),'new@example.invalid');
 await click(button('Select your date of birth'));await click(button('Confirm Date of Birth'));
 await fill(document.getElementById('auth-city'),'Dhaka');await act(async()=>new Promise(resolve=>setTimeout(resolve,500)));await click(button('DhakaBangladesh'));
 await click(document.querySelector('[aria-label="Blood group"]'));await click(button('O-'));
 await click(document.querySelector('[aria-label="Phone country"]'));await click(button('Bangladesh (+880)'));
 await fill(document.querySelector('input[placeholder="Enter local number"]'),'1712345678');
 assert.equal(document.querySelector('button[type=submit]').disabled,false);
 await act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 assert.equal(requests[0].body.mode,'register');assert.equal(requests[0].body.mobile,'+8801712345678');
 if(code==='EXISTING_ACCOUNT'){assert.match(document.querySelector('[role=status]').textContent,/already has an account/);for(let i=0;i<6;i++)await fill(document.getElementById('otp-'+i),'1');await click(button('Verify & Login'));assert.equal(requests[1].body.mode,'login');assert.equal(requests[1].body.name,undefined);console.log('PASS existing email notice and OTP continue to original account');continue;}
 if(late){for(let i=0;i<6;i++)await fill(document.getElementById('otp-'+i),'1');await click(button('Verify & Login'));assert.equal(requests[1].body.mode,'register');}
 const alert=document.querySelector('[role=alert]');assert.ok(alert);assert.match(alert.textContent,code==='EMAIL_ALREADY_REGISTERED'?/email address is already/:code==='PHONE_ALREADY_REGISTERED'?/phone number is already/:/Too many attempts/);
 assert.equal(document.querySelectorAll('[id^="otp-"]').length,0,'Conflicts must show the editable form, not an unusable OTP screen');
 if(code!=='RATE_LIMIT'){await click(button('Log in instead'));assert.equal(document.getElementById('auth-name'),null);assert.ok(document.getElementById('auth-email'));}
 console.log('PASS auth form',code,late?'after OTP verification':'before OTP sending');
}
assert.equal(successes,1,'Only the verified existing-account scenario opens a profile');await act(async()=>root.unmount());dom.window.close();
