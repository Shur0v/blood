// Synthetic, loopback-only preview data. Never run against a live database.
import {getPrisma} from '../../src/backend/config/db';
import {randomUUID} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {signToken} from '../../src/backend/utils/jwt';
import {staffCredentialVersion} from '../../src/backend/utils/staffCredential';
const url=new URL(process.env.DATABASE_URL||'');
if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/bloodnet_preview')throw Error('An isolated bloodnet_preview database is required.');
const db=getPrisma();
const cities:[string,number,number][]=[['Chennai',13.083,80.271],['Coimbatore',11.006,76.967],['Madurai',9.925,78.12],['Kochi',9.94,76.26],['Thiruvananthapuram',8.485,76.95],['Kozhikode',11.259,75.781],['Bengaluru',12.972,77.594],['Mysuru',12.298,76.64],['Mangaluru',12.917,74.856],['Mumbai',19.073,72.883],['Pune',18.52,73.856],['Nagpur',21.146,79.088],['Banda',25.477,80.335],['Lucknow',26.85,80.95],['Kanpur',26.465,80.35],['Varanasi',25.317,82.974],['Noida',28.58,77.33],['Prayagraj',25.435,81.846],['Bhubaneswar',20.296,85.825],['Cuttack',20.465,85.883],['Odisha',20.5,84.4]];
try{
 let n=0;
 for(const [city,lat,lng]of cities){
  if(city==='Kochi'){await db.communityDonor.create({data:{organization_name:'Synthetic Kochi community contact',mobile:'+000000900000',location_city:city,location_country:'India',location_lat:lat,location_lng:lng,source:'Preview fixture',added_by_admin:'fixture'}});continue;}
  for(let i=0;i<(['Chennai','Banda','Odisha'].includes(city)?24:1);i++){
   const user=await db.user.create({data:{profile_code:'I'+String(++n).padStart(3,'0'),name:'Synthetic '+city+' volunteer '+i,email:randomUUID()+'@example.invalid',mobile:'+000'+String(900000+n),blood_group:i%3?'O+':'A+',location_city:city,location_country:'India',location_lat:lat,location_lng:lng,created_at:new Date('2026-10-22T12:00:00Z'),updated_at:new Date('2026-10-22T12:00:00Z')}});
   if(i===0)await db.organPledge.create({data:{user_id:user.id,organ_type:'Kidney',updated_at:new Date('2026-10-22T12:00:00Z')}});
  }
 }
 const admin=await db.adminUser.create({data:{admin_id:'india-preview-'+randomUUID(),password:'fixture-only',role:'ADMIN'}});
 const directory=join(tmpdir(),'bloodnet-india-preview');mkdirSync(directory,{recursive:true});
 writeFileSync(join(directory,'admin-token.txt'),signToken({user_id:admin.id,role:'ADMIN',credential_version:staffCredentialVersion(admin.id,admin.password)}),{mode:0o600});
 console.log('Prepared synthetic India fixtures. No production data used.');
}finally{await db.$disconnect();}
