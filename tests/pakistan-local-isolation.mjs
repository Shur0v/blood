// Run against an isolated, seeded preview. Never point this interaction test at production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const base=process.env.BLOODNET_PREVIEW_URL||'http://127.0.0.1:3107';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const stage=process.argv.includes('--baseline')?'before':'after';
const pilotOnly=process.argv.includes('--pilot-only');
const out=process.env.BLOODNET_PREVIEW_ARTIFACTS||path.join(os.tmpdir(),'bloodnet-pakistan-local-preview');
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


const results=[];
try{const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(portFile);i++)await sleep(100);const [port,browserPath]=fs.readFileSync(portFile,'utf8').trim().split(/\r?\n/);browser=await connect('ws://127.0.0.1:'+port+browserPath);const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();page=await connect(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await page.send('Page.enable');await page.send('Runtime.enable');await page.send('Page.addScriptToEvaluateOnNewDocument',{source:"try{localStorage.setItem('bloodnet_device_seed_v1','pakistan-fixed-visual-seed')}catch{}"});
await navigate('/',390);await sleep(5000);
for(const route of process.argv.includes('--home-mobile-only')?['/']:['/','/india','/nepal','/bangladesh','/pakistan','/us'])for(const width of process.argv.includes('--home-mobile-only')?[390]:[390,768,1440]){await navigate(route,width);await sleep(1500);assert.ok(await evaluate(`!!document.querySelector('h1')&&!document.body.textContent.includes('Application error')`),'A healthy rendered page is required for an isolation snapshot');await evaluate(`document.querySelectorAll('.flex.shrink-0.gap-6.px-4').forEach(e=>{e.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));e.style.setProperty('transform','translateX(0px)','important')});true`);const name=stage+'-fixed-isolation-'+(route.slice(1)||'home')+'-'+width;await screenshot(name);let changedPixels=null,sameDimensions=null;if(stage==='after'){const old=path.join(out,name.replace('after-','before-')+'.png');assert.ok(fs.existsSync(old),'Capture the unmodified build first');const a=await sharp(old).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(path.join(out,name+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});sameDimensions=a.info.width===b.info.width&&a.info.height===b.info.height;if(sameDimensions){changedPixels=0;for(let i=0;i<a.data.length;i+=4)if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2])changedPixels++;}}
results.push({route,width,sameDimensions,changedPixels});}
if(process.argv.includes('--home-mobile-only')&&fs.existsSync(path.join(out,stage+'-fixed-isolation.json'))){const previous=JSON.parse(fs.readFileSync(path.join(out,stage+'-fixed-isolation.json'),'utf8')).results;results.push(...previous.filter(r=>!(r.route==='/'&&r.width===390)));}
fs.writeFileSync(path.join(out,stage+'-fixed-isolation.json'),JSON.stringify({normalization:'Same synthetic database, fixed device shuffle seed, paused marquee transform and reduced motion',results},null,2));if(stage==='after')assert.ok(results.every(r=>r.sameDimensions&&r.changedPixels===0),'All normalized country snapshots must match');console.log(stage+' normalized country isolation captured.');}finally{page?.socket.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close();}else child.kill();}
