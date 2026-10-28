import nextEnv from '@next/env';
import fs from 'node:fs';
import path from 'node:path';
nextEnv.loadEnvConfig(process.cwd(),false);
async function main(){
 const store=await import('../services/recoveryStore'),state=await import('@/src/lib/maintenanceState.server');
 const {runRecoveryJob}=await import('../services/recoveryEngine'),{recordAdminEvent}=await import('../services/adminNotifications');
 state.ensureOperationsRoot();
 const processFile=path.join(state.operationsRoot(),'worker.pid');
 if(fs.existsSync(processFile)){
  const previous=Number(fs.readFileSync(processFile,'utf8'));let alive=false;
  if(Number.isSafeInteger(previous)&&previous>0)try{process.kill(previous,0);alive=true;}catch(error){if((error as NodeJS.ErrnoException).code==='EPERM')alive=true;}
  if(alive)throw Error('A recovery helper is already running.');
  fs.unlinkSync(processFile);
 }
 fs.writeFileSync(processFile,String(process.pid),{flag:'wx',mode:0o600});
 process.on('exit',()=>{try{if(fs.readFileSync(processFile,'utf8')===String(process.pid))fs.unlinkSync(processFile);}catch{}});
 fs.mkdirSync(path.join(state.operationsRoot(),'jobs'),{recursive:true,mode:0o700});
 const {createServer}=await import('node:http'),{recoveryProgress}=await import('../services/recoveryProgress');
 const server=createServer((req,res)=>{
  const match=req.url?.match(/^\/progress\/([a-f0-9-]{36})$/);
  res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Robots-Tag','noindex,nofollow');
  try{const data=req.method==='GET'&&match?recoveryProgress(match[1],String(req.headers['x-recovery-progress']||'')):null;res.statusCode=data?200:401;res.end(JSON.stringify({success:Boolean(data),...(data?{data}:{message:'Unauthorized.'})}));}
  catch{res.statusCode=404;res.end(JSON.stringify({success:false,message:'Operation unavailable.'}));}
 });
 server.listen(Number(process.env.BLOODNET_RECOVERY_PROGRESS_PORT||3219),'127.0.0.1');
 // Never continue an interrupted replacement automatically.
 for(const job of store.allJobs().filter(j=>j.status==='RUNNING')){
  job.status='FAILED';job.stage='Interrupted operation — administrator recovery required';job.error='The recovery service restarted during this operation.';
  store.saveJob(job);store.forgetSecret(job.id);store.releaseRecovery(job.id);
  for(const name of ['snapshot','inspected','restore-input','safety-source','uploads-stage'])fs.rmSync(path.join(store.jobPath(job.id),name),{recursive:true,force:true});
  if(job.kind!=='inspect')state.writeMaintenance({...state.readMaintenance(),enabled:true,lock:null,failed:job.kind==='restore'});
 }
 const active=path.join(state.operationsRoot(),'active.lock');
 if(fs.existsSync(active)){const id=fs.readFileSync(active,'utf8');if(!store.allJobs().some(j=>j.id===id&&j.status==='QUEUED'))store.releaseRecovery(id);}
  // Keep the durable database write gate and filesystem traffic gate consistent after restart.
 try{
  const db=(await import('../config/db')).getPrisma();
  const rows=await db.$queryRaw<Array<{paused:boolean}>>`SELECT paused FROM "MaintenanceGate" WHERE id=1`;
  let raw;try{raw=JSON.parse(fs.readFileSync(path.join(state.operationsRoot(),'maintenance.json'),'utf8'));}catch{raw=state.readMaintenance();}
  if(rows[0]?.paused&&!raw.enabled)raw={...raw,enabled:true,failed:true,deadline:new Date().toISOString(),message:'Recovery checks are required before service resumes.'};
  if(raw.enabled&&!rows[0]?.paused)await db.$executeRaw`UPDATE "MaintenanceGate" SET paused=true WHERE id=1`;
  state.writeMaintenance(raw);
 }catch{if(state.readMaintenance().enabled)state.writeMaintenance({...state.readMaintenance(),enabled:true,failed:true});}
 const heartbeat=()=>fs.writeFileSync(path.join(state.operationsRoot(),'worker-heartbeat'),String(Date.now()),{mode:0o600});
 heartbeat();setInterval(heartbeat,5000).unref(); // Helper liveness only; no browser polling or provider calls.
 while(true){
  for(const job of store.allJobs().filter(j=>j.status==='UPLOADING'&&Date.now()-Date.parse(j.createdAt)>86400000)){
   job.status='FAILED';job.stage='Upload expired after 24 hours';store.saveJob(job);
  }
  const next=store.allJobs().find(j=>j.status==='QUEUED');if(next)await runRecoveryJob(next).catch(()=>{});
  try{
   const raw=JSON.parse(fs.readFileSync(path.join(state.operationsRoot(),'maintenance.json'),'utf8'));
   if(raw.enabled&&!raw.lock&&!raw.failed&&Date.parse(raw.deadline)<=Date.now()){
    await (await import('../config/db')).getPrisma().$executeRaw`UPDATE "MaintenanceGate" SET paused=false WHERE id=1`;
    state.writeMaintenance({...raw,enabled:false});
    await recordAdminEvent({target:{kind:'Maintenance',id:'current'},type:'maintenance.expired',family:'recovery',title:'Maintenance ended automatically',detail:'The deadline passed with no recovery lock.',dedupeKey:'maintenance:expired:'+raw.deadline});
   }
  }catch{}
  for(const job of store.allJobs().filter(j=>['READY','FAILED','SUCCEEDED'].includes(j.status)&&!j.notified))try{
   await recordAdminEvent({target:{kind:'RecoveryJob',id:job.id},type:'recovery.'+job.kind+'.'+job.status.toLowerCase(),family:'recovery',title:job.kind+' operation '+job.status.toLowerCase(),detail:job.stage,occurredAt:new Date(job.updatedAt),dedupeKey:'recovery:'+job.id+':'+job.status,href:'/private/console-0be5626d4305f192e37e/workspace/spam-monitor'});store.saveJob({...job,notified:true});
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
}
void main();
