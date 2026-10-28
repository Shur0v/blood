import {z} from 'zod';
import {ADMIN_WORKSPACE} from './adminNotifications';

export const TARGET_KINDS=['User','Report','VerificationDocument','OrganRequest','MedicalAidRequest','Blog','PublicDonorProfile','Prescription','MedicalReport','AuthRiskEvent','RestrictedIdentity','HomepageContent','PublicPageContent','ServiceAvailability','RegionalPageContent','HomepageSlider','PlatformSettings','FaqItem','Policy','ManualBloodDonor','CommunityDonor','ManualOrganDonor','OrganPledge','RecoveryJob','Maintenance'] as const;
export const NotificationTargetSchema=z.object({
  kind:z.enum(TARGET_KINDS),id:z.string().min(1).max(180),
  ownerId:z.string().uuid().optional(),fields:z.array(z.string().max(80)).max(30).optional(),
  country:z.string().max(120).optional(),city:z.string().max(120).optional(),
}).strict();
export type NotificationTarget=z.infer<typeof NotificationTargetSchema>;
export type NotificationDestination={notificationId:string;href:string;status:'found'|'missing'|'legacy'|'collection';target?:NotificationTarget;marker?:string;page?:number;section?:string;message?:string;operation?:{label:string;status:string};related?:Array<{label:string;href:string}>};
export const targetMarker=(kind:string,id:string)=>kind+':'+id;
export function notificationLink(href:string,id:string){
  // Links are restricted to the administrator workspace, including legacy events.
  let path=ADMIN_WORKSPACE;
  try{const url=new URL(href,'https://bloodnet.invalid');if(url.origin==='https://bloodnet.invalid'&&(url.pathname===ADMIN_WORKSPACE||url.pathname.startsWith(ADMIN_WORKSPACE+'/')))path=url.pathname;}catch{}
  return path+'?notification='+encodeURIComponent(id);
}
export const notificationPaths:Record<NotificationTarget['kind'],string>={
  User:'/users',Report:'/reports',VerificationDocument:'/verify-request',OrganRequest:'/organ-request',MedicalAidRequest:'/financial-requests',Blog:'/write-blog',PublicDonorProfile:'/users',Prescription:'/medical-operations',MedicalReport:'/medical-operations',AuthRiskEvent:'/spam-monitor',RestrictedIdentity:'/spam-monitor',HomepageContent:'',PublicPageContent:'',ServiceAvailability:'',RegionalPageContent:'',HomepageSlider:'/slider-manager',PlatformSettings:'',FaqItem:'/faq',Policy:'/policy',ManualBloodDonor:'/manual-blood-donor',CommunityDonor:'/manual-blood-donor',ManualOrganDonor:'/manual-organ-donor',OrganPledge:'/users',RecoveryJob:'/spam-monitor',Maintenance:'/spam-monitor',
};
