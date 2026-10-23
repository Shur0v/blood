import nextEnv from '@next/env';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { rotateStaffAccounts } from '../services/staffRotation';
import { getPrisma } from '../config/db';

nextEnv.loadEnvConfig(process.cwd(),false);
let muted=false;
const output=new Writable({write(chunk,_encoding,done){if(!muted)process.stdout.write(chunk);done();}});
const input=createInterface({input:process.stdin,output,terminal:Boolean(process.stdin.isTTY)});
async function ask(label:string,secret=false){
  process.stdout.write(label);muted=secret;
  try{return await input.question('');}finally{muted=false;if(secret)process.stdout.write('\n');}
}
async function main(){
  console.log('Updates existing accounts atomically; keeps their database IDs and related records. Old staff sessions will be invalidated.');
  const entries=[];
  for(const role of ['ADMIN','MANAGER'] as const){
    const currentId=(await ask(`${role} current account ID (blank only if exactly one exists): `)).trim();
    const newId=(await ask(`${role} NEW account ID: `)).trim();
    const password=await ask(`${role} NEW password (hidden): `,true);
    if(password!==await ask(`${role} confirm password (hidden): `,true))throw new Error('Passwords did not match. Nothing was saved.');
    entries.push({role,currentId:currentId||undefined,newId,password});
  }
  const result=await rotateStaffAccounts(entries);
  for(const entry of result)console.log(`${entry.role}: ${entry.adminId} updated. Previous sessions revoked.`);
}
main().catch(()=>{console.error('Rotation failed. Verify both current account IDs, unique new IDs and passwords (24–72 bytes), then retry. Both accounts are rolled back together on failure.');process.exitCode=1;}).finally(async()=>{input.close();await getPrisma().$disconnect();});
