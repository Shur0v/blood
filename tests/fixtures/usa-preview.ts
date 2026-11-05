import {getPrisma} from '../../src/backend/config/db';
import {USA_AREAS} from '../../src/lib/usaEdition';
import {USA_CITY_REFERENCES} from '../../src/lib/usaGeography';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {signToken} from '../../src/backend/utils/jwt';
import {staffCredentialVersion} from '../../src/backend/utils/staffCredential';
const url=new URL(process.env.DATABASE_URL||'');
if(!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/bloodnet_preview')throw Error('Only the isolated BloodNet preview database is allowed.');
const db=getPrisma();
try{
 for(const area of USA_AREAS)await db.usaEditorialPage.upsert({where:{area_id:area.id},create:{area_id:area.id,draft:{editorialNote:area.context,recipe:area.recipe},live:{editorialNote:area.context,recipe:area.recipe},published:true,public_updated_at:new Date('2026-11-05T00:00:00Z')},update:{}});
 for(const [name,ref]of Object.entries(USA_CITY_REFERENCES)){
  if(name==='New York')continue;
  if(name==='Las Vegas'){
   for(let i=0;i<22;i++)await db.communityDonor.create({data:{organization_name:'Synthetic Las Vegas organization '+i,mobile:'+000'+randomUUID().slice(0,12),location_city:name,location_country:'United States',location_lat:ref.lat,location_lng:ref.lng,source:'Preview only',added_by_admin:'fixture'}});
  }else await db.user.create({data:{profile_code:'U'+randomUUID().replaceAll('-','').slice(0,3).toUpperCase(),name:'Synthetic '+name+' participant',email:randomUUID()+'@example.invalid',mobile:randomUUID(),blood_group:'A+',location_city:name,location_country:'United States',location_lat:ref.lat,location_lng:ref.lng}});
 }
 const admin=await db.adminUser.create({data:{admin_id:'usa-preview-'+randomUUID(),password:'preview-only-not-a-password',role:'ADMIN'}});
 const token=signToken({user_id:admin.id,role:'ADMIN',credential_version:staffCredentialVersion(admin.id,admin.password)});
 writeFileSync(join(tmpdir(),'bloodnet-usa-preview','admin-token.txt'),token,{mode:0o600});
 console.log('Synthetic USA preview data prepared. No production data used.');
}finally{await db.$disconnect();}
