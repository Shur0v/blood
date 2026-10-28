import {getPrisma} from '../config/db';
import {MedicalError} from '../utils/medicalPrivacy';
import {ADMIN_WORKSPACE} from '@/src/lib/adminNotifications';
import {NotificationTargetSchema,notificationLink,notificationPaths,targetMarker,type NotificationDestination,type NotificationTarget} from '@/src/lib/notificationTargets';
import {readJob} from './recoveryStore';

const sections:Partial<Record<NotificationTarget['kind'],string>>={HomepageContent:'editor-homepage',PublicPageContent:'editor-public-services',ServiceAvailability:'editor-public-services',RegionalPageContent:'editor-regional',PlatformSettings:'switch-patient-id',Policy:'notification-policy',Maintenance:'recovery-center'};
const models={User:'user',Report:'report',VerificationDocument:'verificationDocument',OrganRequest:'organRequest',MedicalAidRequest:'medicalAidRequest',Blog:'blog',PublicDonorProfile:'publicDonorProfile',Prescription:'prescription',MedicalReport:'medicalReport',AuthRiskEvent:'authRiskEvent',RestrictedIdentity:'restrictedIdentity',HomepageContent:'homepageContent',PublicPageContent:'publicPageContent',ServiceAvailability:'serviceAvailability',RegionalPageContent:'regionalPageContent',HomepageSlider:'homepageSlider',PlatformSettings:'platformSettings',FaqItem:'faqItem',Policy:'policy',ManualBloodDonor:'manualBloodDonor',CommunityDonor:'communityDonor',ManualOrganDonor:'manualOrganDonor',OrganPledge:'organPledge'} as const;
const paginated=new Set(['User','Report','VerificationDocument','OrganRequest','Blog','AuthRiskEvent','ManualBloodDonor','CommunityDonor','ManualOrganDonor']);
const settingsSections:Record<string,{section:string;path:string;label:string}>={
 patient_id_visible:{section:'switch-patient-id',path:'',label:'Patient ID visibility'},city_donation_request_visible:{section:'switch-city-request',path:'',label:'City donation requests'},discovery_visible:{section:'switch-discovery',path:'/ads-control',label:'Discovery button'},ui_theme:{section:'controls-theme',path:'/theme-control',label:'Theme'},ads_runtime_enabled:{section:'controls-ads',path:'/ads-control',label:'Advertising'},ad_units_json:{section:'controls-ads',path:'/ads-control',label:'Ad placements'},
};

export async function resolveNotificationDestination(id:string):Promise<NotificationDestination>{
 const db=getPrisma(),event=await db.adminNotification.findUnique({where:{id}});
 if(!event)throw new MedicalError('Notification no longer available.',404);
 const parsed=NotificationTargetSchema.safeParse(event.target);
 if(!parsed.success){
  const catalog=(await import('@/src/lib/adminNotifications')).ADMIN_EVENT_CATALOG;
  const prefix=event.type.split('.')[0];
  const item=catalog.find(row=>row.type===prefix);
  const collection=event.quantity>1||/^db:[0-9a-f-]{36}:/.test(event.dedupe_key);
  const original=new URL(notificationLink(event.href,id),'https://bloodnet.invalid');
  const allowed=new Set(Object.values(notificationPaths).map(path=>ADMIN_WORKSPACE+path));
  const fallback=original.origin==='https://bloodnet.invalid'&&allowed.has(original.pathname)?original.pathname:ADMIN_WORKSPACE;
  const destination=item?ADMIN_WORKSPACE+notificationPaths[item.table as NotificationTarget['kind']]:fallback;
  return {notificationId:id,href:destination,status:collection?'collection':'legacy',message:collection?'This update summarizes multiple records. Review the collection.':'Exact record reference unavailable.'};
 }
 const target=parsed.data,result:NotificationDestination={notificationId:id,href:ADMIN_WORKSPACE+notificationPaths[target.kind],status:'found',target,marker:targetMarker(target.kind,target.id),section:sections[target.kind]};
 if(target.kind==='RecoveryJob'){try{readJob(target.id);}catch{return {...result,status:'missing',marker:undefined,message:'Item no longer available.'};}return result;}
 if(target.kind==='Maintenance')return result;
 const delegate=(db as unknown as Record<string,{findUnique:(args:unknown)=>Promise<any>;count:(args:unknown)=>Promise<number>}>)[models[target.kind]];
 const keyed=['HomepageContent','PublicPageContent','ServiceAvailability','RegionalPageContent'].includes(target.kind);
 const select:Record<string,boolean>={[keyed?'key':'id']:true};
 if(['PublicDonorProfile','OrganPledge'].includes(target.kind))select.user_id=true;
 if(['RegionalPageContent','ServiceAvailability'].includes(target.kind)){select.country=true;select.city=true;}
 const dateField=target.kind==='Blog'?'updated_at':'created_at';
 if(paginated.has(target.kind))select[dateField]=true;
 if(target.kind==='CommunityDonor')select.is_active=true;
 if(target.kind==='Prescription')select.email_status=true;
 if(target.kind==='MedicalReport')select.record_kind=true;
 if(target.kind==='RestrictedIdentity')select.is_active=true;
 if(target.kind==='Policy')select.type=true;
 const row=await delegate.findUnique({where:{[keyed?'key':'id']:target.id},select});
 if(!row||target.kind==='CommunityDonor'&&!row.is_active)return {...result,status:'missing',marker:undefined,message:'Item no longer available.'};
 if(target.kind==='PublicDonorProfile'||target.kind==='OrganPledge'){
  const owner=await db.user.findUnique({where:{id:row.user_id},select:{id:true,created_at:true}});
  if(!owner)return {...result,status:'missing',marker:undefined,message:'Item no longer available.'};
  result.target={...target,kind:'User',id:owner.id};result.marker=targetMarker('User',owner.id);
  result.page=1+Math.floor(await db.user.count({where:{OR:[{created_at:{gt:owner.created_at}},{created_at:owner.created_at,id:{gt:owner.id}}]}})/20);
 }else if(paginated.has(target.kind)){
  result.page=1+Math.floor(await delegate.count({where:{...(target.kind==='CommunityDonor'?{is_active:true}:{}),OR:[{[dateField]:{gt:row[dateField]}},{[dateField]:row[dateField],id:{gt:row.id}}]}})/20);
 }
 if(target.kind==='RegionalPageContent'||target.kind==='ServiceAvailability')result.target={...target,country:row.country,...(row.city?{city:row.city}:{})};
 if(target.kind==='Policy'){result.operation={label:'Policy',status:row.type};result.section=row.type==='FOOTER_CONTACT_INFO'?'notification-footer':'notification-policy';}
 if(target.kind==='Prescription')result.operation={label:'Prescription delivery',status:row.email_status};
 if(target.kind==='MedicalReport')result.operation={label:'Private record received',status:row.record_kind};
 if(target.kind==='RestrictedIdentity')result.operation={label:'Identity restriction',status:row.is_active?'Active':'Inactive'};
 if(target.kind==='PlatformSettings'){
  const controls=[...new Set((target.fields||[]).map(field=>settingsSections[field]).filter(Boolean))];
  const primary=controls[0];result.section=primary?.section||'notification-overview';result.href=ADMIN_WORKSPACE+(primary?.path||'');
  result.related=controls.slice(1).map(control=>({label:control.label,href:ADMIN_WORKSPACE+control.path+'#'+control.section}));
 }
 return result;
}
