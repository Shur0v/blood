import { randomBytes } from 'node:crypto';
import { readFile, writeFile, copyFile, rename, chmod, unlink, open } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'dotenv';

// This initializes storage, never rotates a key protecting existing records.
export async function configureMedicalStorage(directory:string, loadedKey:string|undefined, inheritedKey:string|undefined, hasEncryptedData:()=>Promise<boolean>) {
  if(/^[a-f0-9]{64}$/i.test(loadedKey||''))return {created:false,file:null};
  if(inheritedKey!==undefined)throw new Error('The shell overrides MEDICAL_RECORDS_ENCRYPTION_KEY. Correct or unset that override first. No configuration was changed.');
  const lockFile=path.join(directory,'.env.medical-setup.lock');
  const lock=await open(lockFile,'wx',0o600);
  try {return await initialize(directory,hasEncryptedData);}
  finally {await lock.close();await unlink(lockFile);}
}

async function initialize(directory:string,hasEncryptedData:()=>Promise<boolean>) {
  // Highest production precedence, shared by Next and the prescription worker.
  const file=path.join(directory,'.env.production.local');
  let contents='',exists=false;
  try {contents=await readFile(file,'utf8');exists=true;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  if(/^[a-f0-9]{64}$/i.test(parse(contents).MEDICAL_RECORDS_ENCRYPTION_KEY||''))return {created:false,file:null};
  if(await hasEncryptedData())throw new Error('Encrypted medical data already exists. Restore the original MEDICAL_RECORDS_ENCRYPTION_KEY from your secure backup. A new key was NOT generated.');
  const suffix=Date.now()+'-'+randomBytes(4).toString('hex');
  if(exists){const backup=file+'.backup-medical-'+suffix;await copyFile(file,backup);await chmod(backup,0o600);}
  const next=contents.replace(/^[\t ]*(?:export[\t ]+)?MEDICAL_RECORDS_ENCRYPTION_KEY[\t ]*=.*$/gm,'').trimEnd()+
    '\n\n# Keep this private medical encryption key stable and backed up.\nMEDICAL_RECORDS_ENCRYPTION_KEY="'+randomBytes(32).toString('hex')+'"\n';
  const temporary=file+'.tmp-medical-'+suffix;
  try {await writeFile(temporary,next,{mode:0o600,flag:'wx'});await rename(temporary,file);await chmod(file,0o600);}
  finally {await unlink(temporary).catch(()=>{});}
  return {created:true,file};
}
