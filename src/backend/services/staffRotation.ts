import bcrypt from 'bcryptjs';
import { getPrisma } from '../config/db';

type Rotation = {role:'ADMIN'|'MANAGER'; currentId?:string; newId:string; password:string};
export async function rotateStaffAccounts(entries:Rotation[]) {
  if(entries.length!==2 || new Set(entries.map(e=>e.role)).size!==2) throw new Error('Both staff roles are required.');
  if(entries[0].newId===entries[1].newId || entries[0].password===entries[1].password) throw new Error('Use different credentials for each role.');
  for(const entry of entries) {
    if(!/^[a-zA-Z0-9@._-]{8,120}$/.test(entry.newId)) throw new Error('New account IDs must contain 8–120 letters, numbers or @._-.');
    if(entry.password.length<24 || Buffer.byteLength(entry.password)>72) throw new Error('Use a password of at least 24 characters and at most 72 UTF-8 bytes.');
  }
  const prepared=await Promise.all(entries.map(async entry=>({...entry,hash:await bcrypt.hash(entry.password,12)})));
  return getPrisma().$transaction(async tx=>{
    // Resolve both targets before changing either. Never guess among multiple accounts.
    const targets=await Promise.all(prepared.map(async entry=>{
      const rows=await tx.adminUser.findMany({where:{role:entry.role,...(entry.currentId?{admin_id:entry.currentId}:{})},select:{id:true}});
      if(rows.length!==1) throw new Error(`Expected exactly one ${entry.role} account. Supply its current account ID; no changes were saved.`);
      return {...entry,id:rows[0].id};
    }));
    for(const target of targets) {
      const updated=await tx.adminUser.updateMany({where:{id:target.id,role:target.role},data:{admin_id:target.newId,password:target.hash,last_login:null}});
      if(updated.count!==1)throw new Error('Account changed during rotation. No changes were saved.');
    }
    return targets.map(target=>({role:target.role,adminId:target.newId}));
  });
}
