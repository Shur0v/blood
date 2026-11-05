// Run against an isolated, seeded preview. Never point this interaction test at production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const base=process.env.BLOODNET_PREVIEW_URL||'http://127.0.0.1:3106';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const stage=process.argv.includes('--baseline')?'before':'after';
const pilotOnly=process.argv.includes('--pilot-only');
const out=process.env.BLOODNET_PREVIEW_ARTIFACTS||path.join(os.tmpdir(),'bloodnet-india-preview');
fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'bloodnet-usa-chrome-'));
const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,page;
async function connect(url){
  const socket=new WebSocket(url);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  let id=0;const pending=new Map(),listeners=new Map();
  socket.onmessage=event=>{const message=JSON.parse(event.data);if(!message.id){listeners.get(message.method)?.(message.params);return;}const task=pending.get(message.id);if(!task)return;pending.delete(message.id);clearTimeout(task.timer);message.error?task.reject(Error(message.error.message)):task.resolve(message.result);};
  return {socket,on(method,handler){listeners.set(method,handler);},send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout: '+method));},30000);pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));});}};
}
async function evaluate(expression){const result=await page.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;}
async function navigate(route,width=1440,dark=false){
  console.log('Review '+route+' at '+width+(dark?' dark':''));
  await page.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
  await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:dark?'dark':'light'}]});
  await page.send('Page.navigate',{url:base+route});
  for(let i=0;i<80;i++){try{if(await evaluate(`location.pathname===${JSON.stringify(route)}&&document.readyState==='complete'`))break;}catch{}await sleep(150);}
  await evaluate(`document.documentElement.classList.toggle('dark',${dark});document.fonts.ready.then(()=>true)`);
  await sleep(2200);
  await evaluate(`(()=>{const style=document.createElement('style');style.textContent='*{animation:none!important;transition:none!important;caret-color:transparent!important}';document.head.append(style);return true})()`);
}
async function screenshot(name){const metrics=await page.send('Page.getLayoutMetrics');const size=metrics.cssContentSize;const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:size.width,height:size.height,scale:1}});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(shot.data,'base64'));}

const {INDIA_AREAS,INDIA_RESERVED}=await import('../src/lib/indiaLocal.ts');
const results=[],seen=new Set(),clips=path.join(out,'components');fs.mkdirSync(clips,{recursive:true});
async function info(){return evaluate(`({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,local:!!document.querySelector('.india-local'),components:[...document.querySelectorAll('[data-india-component]')].map(e=>e.dataset.indiaComponent),cards:document.querySelectorAll('[data-regional-card]').length})`);}
try{
 const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(portFile);i++)await sleep(100);
 const [port,browserPath]=fs.readFileSync(portFile,'utf8').trim().split(/\r?\n/);browser=await connect('ws://127.0.0.1:'+port+browserPath);const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();page=await connect(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await page.send('Page.enable');await page.send('Runtime.enable');
 if(!process.argv.includes('--local-only'))for(const route of ['/','/india','/nepal','/bangladesh','/pakistan','/us'])for(const width of [390,768,1440]){
  await navigate(route,width);const state=await info();assert.equal(state.local,false);await screenshot('after-isolation-'+(route.slice(1)||'home')+'-'+width);const before=path.join(out,'before-isolation-'+(route.slice(1)||'home')+'-'+width+'.png'),after=path.join(out,'after-isolation-'+(route.slice(1)||'home')+'-'+width+'.png');let changedPixels=null,sameDimensions=false;
  if(fs.existsSync(before)){const a=await sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(after).ensureAlpha().raw().toBuffer({resolveWithObject:true});sameDimensions=a.info.width===b.info.width&&a.info.height===b.info.height;if(sameDimensions){changedPixels=0;for(let i=0;i<a.data.length;i+=4)if(a.data.subarray(i,i+3).compare(b.data.subarray(i,i+3)))changedPixels++;}}
  results.push({isolation:route,width,sameDimensions,changedPixels,...state});
 }
 for(const area of INDIA_AREAS.filter(area=>!pilotOnly||['chennai','kerala','banda'].includes(area.id))){for(const width of ['chennai','kerala','banda'].includes(area.id)?[320,390,768,1440]:[390,1440]){
  await navigate(area.path,width);const state=await info();assert.ok(state.local,area.path);assert.equal(state.h1,1,area.path);assert.ok(state.scroll<=state.width,area.path+' overflow at '+width);assert.equal(state.components.length,12,area.path+' recipe count');assert.deepEqual(state.components.slice(0,3),['introduction','search','results']);
  if(['chennai','kerala','banda'].includes(area.id))await screenshot('after'+area.path.replaceAll('/','_')+'-'+width);results.push({route:area.path,width,...state});
  if(width===1440){for(const id of state.components){if(seen.has(id))continue;seen.add(id);const box=await evaluate(`(()=>{const e=document.querySelector('[data-india-component="'+${JSON.stringify(id)}+'"]');const b=e.getBoundingClientRect();return {x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:Math.min(b.height,3500)};})()`);if(box.width>0&&box.height>0){const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...box,scale:1}});fs.writeFileSync(path.join(clips,id+'.png'),Buffer.from(shot.data,'base64'));}}}
 }}
 if(!pilotOnly)assert.equal(seen.size,60,'Every component has a visual capture');
 for(const route of ['/blood/chennai','/blood/a-positive/chennai','/blood/o-positive/odisha','/blood/banda','/blood-donors/india/chennai','/blood-donors/india/chennai/a-positive','/organ-donors/india/chennai','/organ/kidney/chennai']){
  await navigate(route,390);const state=await info();assert.ok(state.local,route);assert.equal(state.h1,1,route+' one H1');assert.ok(state.scroll<=state.width,route+' overflow');assert.equal(state.components.length,12,route+' recipe');results.push({route,...state});
 }
 await navigate('/blood/a-positive/chennai',1440);assert.equal(await evaluate(`document.querySelector('[aria-label="Filter by blood group"] [aria-pressed="true"]').textContent`),'A+');const count=await evaluate(`document.querySelectorAll('[data-regional-card]').length`);await evaluate(`document.querySelector('[data-analytics-component="Blood Donor Show More"]').click()`);await sleep(900);assert.ok(await evaluate(`document.querySelectorAll('[data-regional-card]').length`)>count);await evaluate(`document.querySelector('[data-regional-card]').focus();document.querySelector('[data-regional-card]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`);await sleep(200);assert.ok(await evaluate(`!!document.querySelector('[role="dialog"]')`));await screenshot('india-contact-dialog');await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);await sleep(200);
 await navigate('/india/states/kerala',390);await evaluate(`(()=>{const select=document.querySelector('.in-state-search select');select.value='Kozhikode';select.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);await sleep(1000);assert.equal(await evaluate(`document.querySelector('input[placeholder*="Search city"]').value`),'Kozhikode');await evaluate(`document.querySelector('.in-demo-availability button:nth-child(2)')?.click()`);assert.ok(await evaluate(`document.querySelector('.in-demo-availability [role="status"]').textContent.includes('real profile')`));
 await navigate('/india/cities/chennai',390,true);await screenshot('india-local-dark-390');await evaluate(`document.querySelector('.region-actions [data-analytics-component="Regional Register"]').click()`);for(let i=0;i<50;i++){if(await evaluate(`!!document.querySelector('[role="dialog"]')`))break;await sleep(200);}assert.ok(await evaluate(`!!document.querySelector('[role="dialog"]')`),'Registration dialog opens after its lazy-loaded module is ready');await screenshot('india-registration-dialog');
 const token=fs.readFileSync(path.join(out,'admin-token.txt'),'utf8').trim();await page.send('Network.enable');await page.send('Network.setCookie',{name:'bloodnet_session',value:token,url:base,httpOnly:true,sameSite:'Lax'});
 await navigate('/india/preview/chennai',390);assert.ok(await evaluate(`document.querySelector('.in-preview').textContent.includes('Administrator preview')`));await screenshot('india-private-preview');
 const workspace=fs.readFileSync('src/lib/adminNotifications.ts','utf8').match(/ADMIN_WORKSPACE='([^']+)'/)[1];for(const width of [390,1440]){await navigate(workspace,width);await evaluate(`document.querySelector('#editor-india-local').open=true`);await sleep(900);assert.ok(await evaluate(`document.querySelector('#editor-india-local').textContent.includes('India local defaults')`));await evaluate(`document.querySelector('#editor-india-local').scrollIntoView();true`);await screenshot('india-editor-'+width);}
 await page.send('Network.clearBrowserCookies');
 for(const scenario of [{name:'error',status:503,body:{success:false,message:'Fixture unavailable'}},{name:'empty',status:200,body:{success:true,data:[],pagination:{nextCursor:null,total:0},meta:{globalTotal:0}}}]){page.on('Fetch.requestPaused',p=>void page.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:scenario.status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(JSON.stringify(scenario.body)).toString('base64')}));await evaluate('localStorage.clear();sessionStorage.clear();true');await page.send('Fetch.enable',{patterns:[{urlPattern:'*/api/public/donors*'}]});await navigate('/india/cities/chennai',390);assert.equal(await evaluate(`document.querySelectorAll('[data-regional-card]').length`),0);const content=await evaluate(`document.querySelector('#regional-donor-search').textContent`);assert.ok(content.includes(scenario.name==='error'?'Donor cards could not be loaded':'No matching donor entries'));await screenshot('india-'+scenario.name);await page.send('Fetch.disable');results.push({scenario:scenario.name,passed:true});}
 results.push({interactions:'filters, pagination, keyboard contact, state city, local demonstration, registration, preview, admin editor',passed:true});
 fs.writeFileSync(path.join(out,pilotOnly?'final-pilots.json':'final-browser.json'),JSON.stringify(results,null,2));console.log(pilotOnly?'India final pilot browser checks passed.':'India browser checks and sixty component captures passed.');
}finally{page?.socket.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close();}else child.kill();}
