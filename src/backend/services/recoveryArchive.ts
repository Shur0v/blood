import fs from 'node:fs';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {createCipheriv,createDecipheriv,randomBytes,scrypt,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const MAGIC=Buffer.from('BNREC001'),MAX_PACK_BYTES=512*1024**3;
async function derive(password:string,salt:Buffer){if(password.length<16||password.length>512)throw Error('Use a recovery password of 16–512 characters.');return await promisify(scrypt)(password,salt,32) as Buffer;}
export async function fileHash(file:string){const hash=createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');}
export async function packEncrypted(entries:Array<{name:string;file:string}>,output:string,password:string){
 const salt=randomBytes(16),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',await derive(password,salt),iv);cipher.setAAD(MAGIC);const header=Buffer.concat([MAGIC,salt,iv]);fs.writeFileSync(output,header,{mode:0o600});
 async function* frames(){for(const entry of entries){const name=Buffer.from(entry.name),length=fs.statSync(entry.file).size;if(name.length>200||!Number.isSafeInteger(length))throw Error('Invalid recovery entry.');const frame=Buffer.alloc(12);frame.writeUInt32BE(name.length);frame.writeBigUInt64BE(BigInt(length),4);yield frame;yield name;yield* fs.createReadStream(entry.file);}yield Buffer.alloc(12);}
 await pipeline(Readable.from(frames()),cipher,fs.createWriteStream(output,{flags:'a',mode:0o600}));fs.appendFileSync(output,cipher.getAuthTag());
}
export async function unpackEncrypted(input:string,directory:string,password:string){
 const size=fs.statSync(input).size;if(size<64||size>MAX_PACK_BYTES)throw Error('Invalid or oversized recovery package.');const fd=fs.openSync(input,'r'),header=Buffer.alloc(36),tag=Buffer.alloc(16);fs.readSync(fd,header,0,36,0);fs.readSync(fd,tag,0,16,size-16);fs.closeSync(fd);if(!header.subarray(0,8).equals(MAGIC))throw Error('Choose a BloodNet recovery package. Legacy JSON exports cannot be restored here.');
 fs.mkdirSync(directory,{recursive:true,mode:0o700});const raw=path.join(directory,'authenticated.pack'),decipher=createDecipheriv('aes-256-gcm',await derive(password,header.subarray(8,24)),header.subarray(24));decipher.setAAD(MAGIC);decipher.setAuthTag(tag);
 try{await pipeline(fs.createReadStream(input,{start:36,end:size-17}),decipher,fs.createWriteStream(raw,{mode:0o600,flags:'wx'}));}catch{fs.rmSync(raw,{force:true});throw Error('Wrong recovery password or damaged package.');}
 const file=fs.openSync(raw,'r');let offset=0,total=0;const names=new Set<string>();
 try{while(true){const frame=Buffer.alloc(12);if(fs.readSync(file,frame,0,12,offset)!==12)throw Error('Truncated recovery package.');offset+=12;const n=frame.readUInt32BE(),length=Number(frame.readBigUInt64BE(4));if(n===0){if(length!==0||offset!==fs.statSync(raw).size)throw Error('Unexpected archive data.');break;}if(n>200||!Number.isSafeInteger(length)||length<0||(total+=length)>MAX_PACK_BYTES)throw Error('Recovery limits exceeded.');const nameBytes=Buffer.alloc(n);if(fs.readSync(file,nameBytes,0,n,offset)!==n)throw Error('Invalid entry.');offset+=n;const name=nameBytes.toString();if(!/^(database\.dump|manifest\.json|assets\/[a-f0-9]{64})$/.test(name)||names.has(name)||names.size>1000000||offset+length>fs.statSync(raw).size)throw Error('Unsafe or duplicate recovery entry.');names.add(name);const destination=path.join(directory,name);fs.mkdirSync(path.dirname(destination),{recursive:true,mode:0o700});if(length)await pipeline(fs.createReadStream(raw,{start:offset,end:offset+length-1}),fs.createWriteStream(destination,{flags:'wx',mode:0o600}));else fs.writeFileSync(destination,'',{flag:'wx',mode:0o600});offset+=length;}}
 finally{fs.closeSync(file);fs.rmSync(raw,{force:true});}if(!names.has('database.dump')||!names.has('manifest.json'))throw Error('Incomplete recovery package.');return names;
}
