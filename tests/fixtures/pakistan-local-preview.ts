// No production publication. Requires the explicit isolated loopback fixture database.
import {getPrisma} from '../../src/backend/config/db';
import {PAKISTAN_AREAS} from '../../src/lib/pakistanLocal';
import {savePakistanContent} from '../../src/backend/services/pakistanLocalContent';
import {signToken} from '../../src/backend/utils/jwt';
import {staffCredentialVersion} from '../../src/backend/utils/staffCredential';
import {randomUUID} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const url=new URL(process.env.DATABASE_URL||'');
if(!['localhost','127.0.0.1'].includes(url.hostname)||url.port!=='55559'||url.pathname!=='/bloodnet_preview')throw Error('Only the isolated Pakistan preview is permitted.');
const db=getPrisma(),out=join(tmpdir(),'bloodnet-pakistan-local-preview');mkdirSync(out,{recursive:true});
try{
 const admin=await db.adminUser.create({data:{admin_id:'pakistan-preview-'+randomUUID(),password:'fixture-only',role:'ADMIN'}});
 writeFileSync(join(out,'admin-token.txt'),signToken({user_id:admin.id,role:'ADMIN',credential_version:staffCredentialVersion(admin.id,admin.password)}),{mode:0o600});
 for(const area of PAKISTAN_AREAS)await savePakistanContent({areaId:area.id,action:'publish',config:{editorialNote:area.context}});
 console.log('Published 31 synthetic preview guides. No production data or publication used.');
}finally{await db.$disconnect();}
