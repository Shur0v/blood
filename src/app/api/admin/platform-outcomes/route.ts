import {NextResponse} from 'next/server';
import {getPrisma} from '@/src/backend/config/db';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
export const GET=withActiveAdmin(async()=>{
 const db=getPrisma();const [registrations,activated,prescriptions,emailDelivered,events]=await Promise.all([db.user.count(),db.$queryRaw<Array<{count:bigint}>>`SELECT COUNT(*) AS count FROM (SELECT user_id FROM "MedicalReport" UNION SELECT user_id FROM "Prescription") AS activated`,db.prescription.count(),db.prescription.count({where:{email_status:'SENT'}}),db.analyticsClickLog.groupBy({by:['component'],where:{component:{in:['Donor Contact','Donor Call','Regional Doctor Booking','Regional Doctor Contact','Medical Profile Open','Medical Profile Learn']}},_count:{_all:true}})]);
 return NextResponse.json({success:true,data:{registeredAccounts:registrations,profilesWithRecords:Number(activated[0]?.count||0),acceptedPartnerPrescriptions:prescriptions,prescriptionEmailsDelivered:emailDelivered,publicActions:events.map(row=>({action:row.component,count:row._count._all})),definitions:'Current account and record totals, plus recorded public action initiations. A click is not a donor reply, confirmed appointment or completed consultation.'}},{headers:privateHeaders});
});
