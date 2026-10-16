import {test} from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {existsSync,mkdtempSync,writeFileSync,readFileSync,mkdirSync,readdirSync,unlinkSync,rmdirSync} from 'node:fs';import os from 'node:os';import path from 'node:path';
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'/bin/bash';
const shellPath=(value:string)=>process.platform==='win32'?'/'+value[0].toLowerCase()+value.slice(2).replaceAll('\\','/'):value;
test('bash deploy-prod.sh runs safe medical setup, backups, build, migrations, restart and health in order',{skip:!existsSync(bash)},()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'bloodnet-deploy-command-')),bin=path.join(dir,'bin'),log=path.join(dir,'calls.log');mkdirSync(bin);writeFileSync(path.join(dir,'.env'),'SYNTHETIC_TEST=true\n');
 const tools=['git','node','npm','npx','pm2','curl','pg_dump','pg_restore','tar','systemctl'];
 try{
 for(const tool of tools)writeFileSync(path.join(bin,tool),'#!/usr/bin/env bash\nprintf "%s\\n" "${0##*/} $*" >> "$BLOODNET_DEPLOY_TEST_LOG"\nif [[ "${0##*/}" == npm && "$*" == "run medical:configure" && "${BLOODNET_DEPLOY_TEST_FAIL:-}" == 1 ]]; then exit 1; fi\nexit 0\n',{mode:0o755});
 writeFileSync(path.join(bin,'git'),readFileSync(path.join(bin,'git'),'utf8').replace('exit 0','if [[ $1 == show ]]; then cat "$BLOODNET_DEPLOY_TEST_SCRIPT"; fi\nexit 0'));
 const env={...process.env,BLOODNET_DEPLOY_TEST_SCRIPT:shellPath(path.resolve('deploy/deploy.sh')),PATH:shellPath(bin)+':/usr/bin:/bin',BLOODNET_DEPLOY_TEST_BIN:shellPath(bin),BLOODNET_APP_DIR:shellPath(dir),BLOODNET_DEPLOY_TEST_LOG:shellPath(log)};
 const syntax=spawnSync(bash,['-n',shellPath(path.resolve('deploy-prod.sh'))],{env,encoding:'utf8',windowsHide:true});assert.equal(syntax.status,0,syntax.stderr);
 const run=spawnSync(bash,['--noprofile','--norc','-c','export PATH="$BLOODNET_DEPLOY_TEST_BIN:/usr/bin:/bin"; exec bash "$1"','--',shellPath(path.resolve('deploy-prod.sh'))],{env,encoding:'utf8',windowsHide:true});assert.equal(run.status,0,run.stderr);const calls=readFileSync(log,'utf8').split('\n');
 const at=(prefix:string)=>{const index=calls.findIndex(line=>line.startsWith(prefix));assert.ok(index>=0,prefix);return index;};
 assert.ok(at('pm2 stop bloodnet')<at('npm ci'));assert.ok(at('npm ci')<at('npm run medical:configure'));assert.ok(at('npm run medical:configure')<at('npm run deploy:check -- --database'));
 assert.ok(at('npm run db:backup')<at('npm run build'));
 const migration=calls.findIndex(line=>/prisma migrate deploy/.test(line));assert.ok(migration>at('npm run build'));assert.ok(at('npm run deploy:check -- --schema')<at('pm2 start '));assert.ok(at('pm2 start ')<at('curl --fail'));assert.ok(at('curl --fail')<at('pm2 save'));
 writeFileSync(log,'');const failed=spawnSync(bash,['--noprofile','--norc','-c','export PATH="$BLOODNET_DEPLOY_TEST_BIN:/usr/bin:/bin"; exec bash "$1"','--',shellPath(path.resolve('deploy-prod.sh'))],{env:{...env,BLOODNET_DEPLOY_TEST_FAIL:'1'},encoding:'utf8',windowsHide:true});assert.notEqual(failed.status,0);const refused=readFileSync(log,'utf8');assert.ok(!refused.includes('npm run build'));assert.ok(!refused.includes('pm2 start '));assert.match(failed.stderr,/Deployment stopped/);
 }finally{for(const tool of tools)unlinkSync(path.join(bin,tool));rmdirSync(bin);if(existsSync(path.join(dir,'logs')))rmdirSync(path.join(dir,'logs'));for(const name of readdirSync(dir))unlinkSync(path.join(dir,name));rmdirSync(dir);}
});
