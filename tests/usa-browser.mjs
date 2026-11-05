// Run against an isolated, seeded preview. Never point this interaction test at production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const base=process.env.BLOODNET_PREVIEW_URL||'http://127.0.0.1:3105';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const stage=process.argv.includes('--baseline')?'before':'after';
const editorOnly=process.argv.includes('--editor-only');
const out=process.env.BLOODNET_PREVIEW_ARTIFACTS||path.join(os.tmpdir(),'bloodnet-usa-preview');
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
try {
  const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;i<100&&!fs.existsSync(portFile);i++)await sleep(100);
  const [port,browserPath]=fs.readFileSync(portFile,'utf8').trim().split(/\r?\n/);
  browser=await connect('ws://127.0.0.1:'+port+browserPath);
  const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  page=await connect(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await page.send('Page.enable');await page.send('Runtime.enable');
  for(const route of editorOnly||process.argv.includes('--usa-only')?[]:['/','/india','/nepal','/bangladesh','/pakistan'])for(const width of [390,768,1440]){
    await navigate(route,width);const name=stage+'-isolation-'+(route.slice(1)||'home')+'-'+width;await screenshot(name);
    const current=await evaluate(`({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,usa:!!document.querySelector('.usa-page')})`);
    assert.equal(current.usa,false,route+' must not use USA presentation');
    if(stage==='after'){
      const before=path.join(out,name.replace('after-','before-')+'.png');
      if(fs.existsSync(before)){const a=await sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true});const b=await sharp(path.join(out,name+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});let changed=null;if(a.info.width===b.info.width&&a.info.height===b.info.height){changed=0;for(let i=0;i<a.data.length;i+=4)if(a.data.subarray(i,i+3).compare(b.data.subarray(i,i+3)))changed++;}results.push({route,width,...current,changedPixels:changed,sameDimensions:a.info.width===b.info.width&&a.info.height===b.info.height});}
    }
  }
  if(stage==='after'&&!editorOnly){
    const areas=['/us/states/california',...['las-vegas','los-angeles','san-francisco','san-diego','new-york-city','chicago','houston','dallas','miami','atlanta','seattle','boston','phoenix'].map(slug=>'/us/cities/'+slug)];
    for(const route of ['/us',...areas,'/blood/los-angeles','/blood/a-positive/los-angeles','/blood-donors/united-states/las-vegas','/network/united-states'])for(const width of route==='/us'?[320,390,768,1440]:route===areas[0]||route===areas[1]?[390,768,1440]:[390]){
      await navigate(route,width);
      const info=await evaluate(`({page:!!document.querySelector('.usa-page'),width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,components:[...document.querySelectorAll('[data-us-component]')].map(e=>e.dataset.usComponent),cards:document.querySelectorAll('[data-regional-card]').length})`);
      assert.ok(info.page,route);assert.ok(info.scroll<=info.width,route+' horizontal overflow '+width);assert.equal(info.h1,1,route+' one H1');
      if(route==='/us')assert.equal(info.components.length,20,'Country has twenty sections');
      if(areas.includes(route)){assert.equal(info.components.length,12,route+' has twelve sections');assert.deepEqual(info.components.slice(0,3),['hero','search','results']);}
      if(info.components.includes('search')){const layout=await evaluate(`(()=>{const heading=document.querySelector('.region-search-title').getBoundingClientRect(),filters=document.querySelector('.donor-blood-filters').getBoundingClientRect();return {headingBottom:heading.bottom,filtersTop:filters.top};})()`);assert.ok(layout.headingBottom<=layout.filtersTop,'No search overlap at '+width);}
      await screenshot(stage+route.replaceAll('/','_')+'-'+width);results.push({route,width,...info});
    }
    await navigate('/us',390,true);await screenshot('usa-dark-390');
    // Filters and paginated cards use the real preview backend; never submit a form.
    await navigate('/us');
    const initial=await evaluate(`document.querySelectorAll('[data-regional-card]').length`);assert.ok(initial>0);
    await evaluate(`document.querySelector('[data-analytics-component="Blood Donor Show More"]')?.click()`);await sleep(1200);
    const more=await evaluate(`document.querySelectorAll('[data-regional-card]').length`);assert.ok(more>initial,'Load more appends donor cards');
    await evaluate(`[...document.querySelectorAll('[aria-label="Filter by blood group"] button')].find(b=>b.textContent==='A+').click()`);await sleep(1000);
    assert.equal(await evaluate(`document.querySelector('[aria-label="Filter by blood group"] [aria-pressed="true"]').textContent`),'A+');
    await evaluate(`document.querySelector('[data-regional-card]').focus();document.querySelector('[data-regional-card]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`);await sleep(250);
    assert.ok(await evaluate(`!!document.querySelector('[role="dialog"]')`),'Keyboard donor contact opens');
    await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);await sleep(200);
    assert.equal(await evaluate(`!!document.querySelector('[role="dialog"]')`),false);
    await evaluate(`document.querySelector('[data-analytics-component="USA Login"]').click()`);await sleep(800);
    assert.ok(await evaluate(`document.querySelector('[role="dialog"]')?.textContent.includes('Login to BloodNet')`),'Login flow opens');
    assert.ok(await evaluate(`parseFloat(getComputedStyle(document.querySelector('[role="dialog"] h2')).fontSize)<=32`),'Page typography must not enlarge the login dialog');
    await screenshot('usa-login-dialog');
    results.push({interaction:'load more, category filter, keyboard donor modal, login',passed:true});
    const token=fs.readFileSync(path.join(out,'admin-token.txt'),'utf8').trim();
    await page.send('Network.enable');await page.send('Network.setCookie',{name:'bloodnet_session',value:token,url:base,httpOnly:true,sameSite:'Lax'});
    await navigate('/us/preview/las-vegas',390);assert.ok(await evaluate(`document.querySelector('.us-preview')?.textContent.includes('Administrator draft preview')`));await screenshot('usa-protected-preview-390');
    await page.send('Network.clearBrowserCookies');
    for(const scenario of [{name:'error',status:503,body:{success:false,message:'Preview unavailable'}},{name:'empty',status:200,body:{success:true,data:[],pagination:{nextCursor:null,total:0},meta:{globalTotal:0}}}]){
      page.on('Fetch.requestPaused',params=>{void page.send('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:scenario.status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(JSON.stringify(scenario.body)).toString('base64')});});
      await evaluate('localStorage.clear();sessionStorage.clear();true');
      await page.send('Fetch.enable',{patterns:[{urlPattern:'*/api/public/donors*'}]});
      await navigate('/us',390);
      const text=await evaluate(`document.querySelector('#regional-donor-search').textContent`);
      assert.ok(text.includes(scenario.name==='error'?'Donor cards could not be loaded':'No matching donor entries'),scenario.name+' state remains useful: '+text.slice(-650));
      assert.equal(await evaluate(`document.querySelectorAll('[data-regional-card]').length`),0);
      await screenshot('usa-'+scenario.name+'-390');
      await page.send('Fetch.disable');results.push({scenario:scenario.name,passed:true});
    }
  }
  if(editorOnly){
    const token=fs.readFileSync(path.join(out,'admin-token.txt'),'utf8').trim();
    await page.send('Network.enable');await page.send('Network.setCookie',{name:'bloodnet_session',value:token,url:base,httpOnly:true,sameSite:'Lax'});
    const registry=fs.readFileSync('src/lib/adminNotifications.ts','utf8'),workspace=registry.match(/ADMIN_WORKSPACE='([^']+)'/)[1];
    for(const width of [390,1440]){
      await navigate(workspace,width);
      assert.ok(await evaluate(`!!document.querySelector('#editor-usa')`),'USA editor belongs to the administrator overview');
      await evaluate(`document.querySelector('#editor-usa').open=true`);await sleep(1000);
      await evaluate(`document.querySelector('#editor-usa').scrollIntoView();true`);
      assert.ok(await evaluate(`document.querySelector('#editor-usa').textContent.includes('United States / country')`));
      await screenshot('usa-editor-'+width);
      results.push({editor:true,width,passed:true});
    }
  }
  fs.writeFileSync(path.join(out,editorOnly?'editor-browser.json':stage+'-browser.json'),JSON.stringify(results,null,2));
  console.log(stage+' browser checks passed; artifacts: '+out);
}finally{page?.socket.close();if(browser){await browser.send('Browser.close').catch(()=>{});browser.socket.close();}else child.kill();}
