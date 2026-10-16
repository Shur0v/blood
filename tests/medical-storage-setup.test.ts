import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, unlink, rmdir, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parse } from 'dotenv';
import { configureMedicalStorage } from '../src/backend/services/medicalStorageSetup';

test('initial medical-storage setup preserves other settings, backs up privately and never rotates a key',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'bloodnet-key-setup-'));
  try {
    const file=path.join(dir,'.env.production.local'),original='OTHER_SETTING="keep-this-value"\nMEDICAL_RECORDS_ENCRYPTION_KEY=""\n';
    await writeFile(file,original);
    const result=await configureMedicalStorage(dir,undefined,undefined,async()=>false);assert.equal(result.created,true);
    const contents=await readFile(file,'utf8'),env=parse(contents);assert.match(env.MEDICAL_RECORDS_ENCRYPTION_KEY,/^[a-f0-9]{64}$/);assert.equal(env.OTHER_SETTING,'keep-this-value');
    const backup=(await readdir(dir)).find(name=>name.includes('backup-medical'));assert.ok(backup);assert.equal(await readFile(path.join(dir,backup),'utf8'),original);
    if(process.platform!=='win32')assert.equal((await stat(file)).mode&0o777,0o600);
    assert.equal((await configureMedicalStorage(dir,env.MEDICAL_RECORDS_ENCRYPTION_KEY,undefined,async()=>true)).created,false);
    assert.equal((await configureMedicalStorage(dir,undefined,undefined,async()=>true)).created,false,'A stale caller must also preserve the valid on-disk key');
    assert.equal(await readFile(file,'utf8'),contents);
  } finally {for(const name of await readdir(dir))await unlink(path.join(dir,name));await rmdir(dir);}
});

test('missing-key setup refuses existing encrypted records and inherited shell overrides without changing files',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'bloodnet-key-protection-'));
  try {
    const file=path.join(dir,'.env.production.local'),original='OTHER_SETTING="keep"\n';await writeFile(file,original);
    await assert.rejects(()=>configureMedicalStorage(dir,undefined,undefined,async()=>true),/Restore the original/);
    await assert.rejects(()=>configureMedicalStorage(dir,'invalid','invalid',async()=>false),/shell overrides/);
    assert.equal(await readFile(file,'utf8'),original);assert.deepEqual(await readdir(dir),['.env.production.local']);
  } finally {for(const name of await readdir(dir))await unlink(path.join(dir,name));await rmdir(dir);}
});
