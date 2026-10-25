import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn,spawnSync,type ChildProcess} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import {Client} from 'pg';

const controlUrl=process.env.TEST_RECOVERY_CONTROL_URL;
test('helper restart holds interrupted recovery past its deadline and only safe expiry reopens database writes',{skip:!controlUrl,timeout:60000},async()=>{
 const control=new URL(controlUrl!);assert.equal(control.hostname,'127.0.0.1');assert.equal(control.port,'55444');
 const root=new Client({connectionString:control.href});await root.connect();const database='bloodnet_medical_test_worker_'+Date.now(),directory=fs.mkdtempSync(path.join(os.tmpdir(),'bloodnet-worker-rehearsal-')),operations=path.join(directory,'operations'),id=randomUUID(),appRoot=process.cwd();let child:ChildProcess|undefined;
 const url=new URL(control.href);url.pathname='/'+database;
 const environment={...process.env,DATABASE_URL:url.href,JWT_SECRET:randomBytes(32).toString('hex'),MEDICAL_RECORDS_ENCRYPTION_KEY:randomBytes(32).toString('hex'),SMTP_HOST:'127.0.0.1',SMTP_USER:'test@example.invalid',SMTP_PASS:'test-only',GEOAPIFY_API_KEY:'test-only',BLOODNET_OPERATIONS_DIR:operations,BLOODNET_PUBLIC_RUNTIME_DIR:path.join(directory,'notice'),BLOODNET_RECOVERY_PROGRESS_PORT:'0'};
 const stateFile=path.join(operations,'maintenance.json'),jobFile=path.join(operations,'jobs',id,'state.json');
 async function until(check:()=>boolean|Promise<boolean>){for(let n=0;n<80;n++){if(await check())return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('The isolated helper did not reach its expected state.');}
 function start(){child=spawn(process.execPath,[path.join(appRoot,'node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(appRoot,'tsconfig.json'),path.join(appRoot,'src/backend/scripts/recoveryWorker.ts')],{cwd:directory,env:environment,windowsHide:true,stdio:'ignore'});}
 async function stop(){try{const pid=Number(fs.readFileSync(path.join(operations,'worker.pid'),'utf8'));if(Number.isSafeInteger(pid)&&pid>0)process.kill(pid);}catch{}child?.kill();await new Promise(resolve=>setTimeout(resolve,250));}
 try{
  await root.query(`CREATE DATABASE "${database}" TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`);
  const migration=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{cwd:appRoot,env:environment,encoding:'utf8',windowsHide:true,timeout:30000});assert.equal(migration.status,0,'Worker rehearsal migrations must pass');
  fs.mkdirSync(path.dirname(jobFile),{recursive:true});fs.writeFileSync(jobFile,JSON.stringify({id,adminId:randomUUID(),kind:'restore',status:'RUNNING',stage:'Synthetic interrupted operation',target:database,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}));fs.writeFileSync(path.join(operations,'active.lock'),id);
  fs.writeFileSync(stateFile,JSON.stringify({enabled:true,deadline:new Date(Date.now()-60000).toISOString(),message:'Synthetic rehearsal',lock:id,failed:false,updatedAt:new Date().toISOString()}));
  start();await until(()=>{try{return JSON.parse(fs.readFileSync(jobFile,'utf8')).status==='FAILED'&&JSON.parse(fs.readFileSync(stateFile,'utf8')).failed;}catch{return false;}});
  await until(async()=>{const db=new Client({connectionString:url.href});try{await db.connect();return (await db.query('SELECT paused FROM "MaintenanceGate" WHERE id=1')).rows[0].paused;}finally{await db.end();}});
  assert.equal(JSON.parse(fs.readFileSync(stateFile,'utf8')).enabled,true);assert.equal(fs.existsSync(path.join(operations,'active.lock')),false);
  await stop();start();await until(()=>{try{return Number(fs.readFileSync(path.join(operations,'worker-heartbeat'),'utf8'))>Date.now()-1000;}catch{return false;}});assert.equal(JSON.parse(fs.readFileSync(stateFile,'utf8')).failed,true,'Restart cannot clear a failed restore');
  // Simulate deliberate operator resolution on this disposable installation only.
  fs.writeFileSync(stateFile,JSON.stringify({enabled:true,deadline:new Date(Date.now()-60000).toISOString(),message:'',lock:null,failed:false,updatedAt:new Date().toISOString()}));
  await until(()=>!JSON.parse(fs.readFileSync(stateFile,'utf8')).enabled);
  const db=new Client({connectionString:url.href});try{await db.connect();assert.equal((await db.query('SELECT paused FROM "MaintenanceGate" WHERE id=1')).rows[0].paused,false);}finally{await db.end();}
 }finally{
  await stop();await root.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1',[database]);await root.query(`DROP DATABASE IF EXISTS "${database}"`);await root.end();assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep+'bloodnet-worker-rehearsal-'));fs.rmSync(directory,{recursive:true,force:true});
 }
});
