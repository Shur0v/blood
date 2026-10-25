import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {GetObjectCommand,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {randomUUID} from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import {getR2Client} from './mediaStorage';
import {fileHash} from './recoveryArchive';
import type {RecoveryManifest} from './recoveryStore';
export function validStorageKey(key:string){return /^(local\/)?(profile|verification|medical_aid|blog|slider|other)\/[a-zA-Z0-9_./-]+$/.test(key)&&!key.split('/').some(part=>part==='..'||part==='.'||!part);}
export async function preflightRecoveryStorage(files:RecoveryManifest['files']){
 if(!files.some(file=>!file.storageKey.startsWith('local/')))return;
 const client=getR2Client(),Bucket=process.env.R2_BUCKET;
 if(!client||!Bucket)throw Error('Configure managed R2 storage before restoration.');
 const Key='other/recovery-check/'+randomUUID(),Body=Buffer.from('BloodNet recovery access check');
 try{await client.send(new PutObjectCommand({Bucket,Key,Body,ContentType:'application/octet-stream'}));const response=await client.send(new GetObjectCommand({Bucket,Key}));if(!response.Body||!Buffer.from(await response.Body.transformToByteArray()).equals(Body))throw Error('Storage access check failed.');}
 finally{await client.send(new DeleteObjectCommand({Bucket,Key}));}
}
export async function captureRecoveryMedia(root:string,assets:Array<{storage_key:string;variants:unknown}>){const keys=new Set<string>();for(const asset of assets){keys.add(asset.storage_key);if(Array.isArray(asset.variants))for(const v of asset.variants)if(v&&typeof v.storageKey==='string')keys.add(v.storageKey);}
 const uploads=path.resolve(process.cwd(),'public','uploads');if(fs.existsSync(uploads)&&fs.lstatSync(uploads).isSymbolicLink())throw Error('The upload root must not be a symbolic link.');function walk(dir:string){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const name=path.join(dir,item.name);if(item.isSymbolicLink())throw Error('Uploaded media contains a symbolic link. Resolve it before backup.');if(item.isDirectory())walk(name);else if(item.isFile())keys.add('local/'+path.relative(uploads,name).replaceAll('\\','/'));}}walk(uploads);
 const files:RecoveryManifest['files']=[],client=getR2Client();for(const storageKey of [...keys].sort()){if(!validStorageKey(storageKey))throw Error('Unsupported managed storage key. Review storage before backup.');const entry='assets/'+createHash('sha256').update(storageKey).digest('hex'),destination=path.join(root,entry);fs.mkdirSync(path.dirname(destination),{recursive:true,mode:0o700});if(storageKey.startsWith('local/')){const source=path.resolve(uploads,storageKey.slice(6));if(!source.startsWith(uploads+path.sep)||fs.lstatSync(source).isSymbolicLink())throw Error('Unsafe media path.');fs.copyFileSync(source,destination);}else{if(!client||!process.env.R2_BUCKET)throw Error('R2 credentials are needed to capture all managed media.');const response=await client.send(new GetObjectCommand({Bucket:process.env.R2_BUCKET,Key:storageKey}));if(!response.Body)throw Error('A managed R2 file is unavailable.');await pipeline(response.Body as NodeJS.ReadableStream,fs.createWriteStream(destination,{mode:0o600}));}files.push({entry,storageKey,size:fs.statSync(destination).size,sha256:await fileHash(destination)});}return files;}
export async function restoreRecoveryMedia(root:string,files:RecoveryManifest['files'],localStage:string){fs.mkdirSync(localStage,{recursive:true,mode:0o700});const client=getR2Client();for(const file of files){if(!validStorageKey(file.storageKey))throw Error('Unsafe media key.');const source=path.join(root,file.entry);if(file.storageKey.startsWith('local/')){const target=path.resolve(localStage,file.storageKey.slice(6));if(!target.startsWith(path.resolve(localStage)+path.sep))throw Error('Unsafe local media path.');fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}else{if(!client||!process.env.R2_BUCKET)throw Error('Configure the original R2 storage before restoring.');await client.send(new PutObjectCommand({Bucket:process.env.R2_BUCKET,Key:file.storageKey,Body:fs.createReadStream(source),ContentLength:file.size,ContentType:file.storageKey.startsWith('verification/')?'application/octet-stream':'image/webp'}));}}}
