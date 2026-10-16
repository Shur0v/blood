import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'/bin/bash';
const shellPath=(value:string)=>process.platform==='win32'?'/'+value[0].toLowerCase()+value.slice(2).replaceAll('\\','/'):value;

test('single-command deploy generates Prisma first, selects a private supported runtime, and fails closed',{skip:!existsSync(bash)},()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'bloodnet-deploy-command-')),bin=path.join(dir,'bin'),log=path.join(dir,'calls.log');
 mkdirSync(bin);writeFileSync(path.join(dir,'.env'),'SYNTHETIC_TEST=true\n');
 const tools=['git','node','npm','npx','pm2','curl','pg_dump','pg_restore','tar','systemctl'];
 const stub=`#!/usr/bin/env bash
printf "%s\\n" "\${0##*/} $*" >> "$BLOODNET_DEPLOY_TEST_LOG"
case "\${0##*/}" in
 git) if [[ $1 == show ]]; then cat "$BLOODNET_DEPLOY_TEST_SCRIPT"; fi ;;
 node) if [[ "\${BLOODNET_DEPLOY_TEST_OLD_NODE:-}" == 1 ]]; then exit 1; fi ;;
 npm)
  if [[ $1 == install ]]; then
   if [[ "\${BLOODNET_DEPLOY_TEST_FAIL:-}" == runtime ]]; then exit 1; fi
   mkdir -p "$BLOODNET_RUNTIME_DIR/node_modules/node/bin"
   cp "$BLOODNET_DEPLOY_TEST_RUNTIME_FIXTURE" "$BLOODNET_RUNTIME_DIR/node_modules/node/bin/node"
   chmod +x "$BLOODNET_RUNTIME_DIR/node_modules/node/bin/node"
  fi
  if [[ $1 == ci ]]; then rm -f "$BLOODNET_DEPLOY_TEST_MARKER"; fi
  if [[ "$*" == "run db:generate" ]]; then
   if [[ "\${BLOODNET_DEPLOY_TEST_FAIL:-}" == generate ]]; then exit 1; fi
   touch "$BLOODNET_DEPLOY_TEST_MARKER"
  fi
  if [[ "$*" == "run medical:configure" && "\${BLOODNET_DEPLOY_TEST_FAIL:-}" == medical ]]; then exit 1; fi
  if [[ "$*" == run\\ deploy:check* && ! -f "$BLOODNET_DEPLOY_TEST_MARKER" ]]; then echo "Prisma client was not generated" >&2; exit 1; fi
  ;;
 pm2) if [[ $1 == start ]]; then printf "runtime=%s\\n" "$BLOODNET_NODE_EXECUTABLE" >> "$BLOODNET_DEPLOY_TEST_LOG"; fi ;;
esac
exit 0
`;
 try {
  for(const tool of tools)writeFileSync(path.join(bin,tool),stub,{mode:0o755});
  const runtimeFixture=path.join(dir,'runtime-node.sh');writeFileSync(runtimeFixture,'#!/usr/bin/env bash\nexit 0\n',{mode:0o755});
  const env={...process.env,BLOODNET_DEPLOY_TEST_SCRIPT:shellPath(path.resolve('deploy/deploy.sh')),BLOODNET_DEPLOY_TEST_BIN:shellPath(bin),BLOODNET_APP_DIR:shellPath(dir),BLOODNET_DEPLOY_TEST_LOG:shellPath(log),BLOODNET_DEPLOY_TEST_MARKER:shellPath(path.join(dir,'generated')),BLOODNET_RUNTIME_DIR:shellPath(path.join(dir,'runtime')),BLOODNET_DEPLOY_TEST_RUNTIME_FIXTURE:shellPath(runtimeFixture)};
  const args=['--noprofile','--norc','-c','export PATH="$BLOODNET_DEPLOY_TEST_BIN:/usr/bin:/bin"; exec bash "$1"','--',shellPath(path.resolve('deploy-prod.sh'))];
  const run=(extra:Record<string,string>={})=>{writeFileSync(log,'');return spawnSync(bash,args,{env:{...env,...extra},encoding:'utf8',windowsHide:true});};
  for(const script of ['deploy-prod.sh','deploy/deploy.sh'])assert.equal(spawnSync(bash,['-n',shellPath(path.resolve(script))],{encoding:'utf8',windowsHide:true}).status,0);
  const success=run();assert.equal(success.status,0,success.stderr);
  const calls=readFileSync(log,'utf8').split('\n');
  const at=(prefix:string)=>{const index=calls.findIndex(line=>line.startsWith(prefix));assert.ok(index>=0,prefix);return index;};
  assert.ok(at('pm2 stop bloodnet')<at('npm ci'));
  assert.ok(at('npm ci')<at('npm run db:generate'));
  assert.ok(at('npm run db:generate')<at('npm run medical:configure'));
  assert.ok(at('npm run medical:configure')<at('npm run deploy:check -- --database'));
  assert.ok(at('npm run db:backup')<at('npm run build'));
  assert.ok(at('npm run build')<at('npx prisma migrate deploy'));
  assert.ok(at('npm run deploy:check -- --schema')<at('pm2 start '));
  assert.ok(at('pm2 start ')<at('curl --fail'));assert.ok(at('curl --fail')<at('pm2 save'));
  for(const stage of ['generate','medical']){
   const failed=run({BLOODNET_DEPLOY_TEST_FAIL:stage});assert.notEqual(failed.status,0);
   const refused=readFileSync(log,'utf8');assert.ok(!refused.includes('npm run build'));assert.ok(!refused.includes('pm2 start '));assert.ok(!refused.includes('npx prisma migrate deploy'));assert.match(failed.stderr,/Deployment stopped/);
  }
  const old=run({BLOODNET_DEPLOY_TEST_OLD_NODE:'1'});assert.equal(old.status,0,old.stderr);
  const runtimeCalls=readFileSync(log,'utf8');assert.match(runtimeCalls,/npm install --prefix .*node@22/);
  assert.ok(runtimeCalls.includes('runtime='+env.BLOODNET_RUNTIME_DIR+'/node_modules/node/bin/node'));
  assert.ok(!runtimeCalls.includes('npm install -g'),'Never change the shared Node or PM2 installation');
  const reuse=run({BLOODNET_DEPLOY_TEST_OLD_NODE:'1'});assert.equal(reuse.status,0,reuse.stderr);assert.ok(!readFileSync(log,'utf8').includes('npm install --prefix'),'Keep an existing supported private runtime');
  const runtimeFailure=run({BLOODNET_DEPLOY_TEST_OLD_NODE:'1',BLOODNET_DEPLOY_TEST_FAIL:'runtime',BLOODNET_RUNTIME_DIR:shellPath(path.join(dir,'unavailable-runtime'))});assert.notEqual(runtimeFailure.status,0);const preflight=readFileSync(log,'utf8');assert.ok(!preflight.includes('pm2 stop '));assert.ok(!preflight.includes('npm ci'));
 } finally {
  assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'bloodnet-deploy-command-'));
  rmSync(dir,{recursive:true,force:true});
 }
});
