import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { medicalStorageConfigured } from '@/src/backend/utils/medicalPrivacy';

async function handleGET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  if (!hasRequiredRole(session,ADMIN_ROLES)) return NextResponse.json({success:false,message:'Forbidden'},{status:403});
  try {
    const db = getPrisma();
    const [users, identified, reports, uploadedPrescriptions, doctorPrescriptions, delivery, storage, marrow] = await Promise.all([
      db.user.count(), db.user.count({where:{profile_code:{not:''}}}),
      db.medicalReport.count({where:{record_kind:'REPORT'}}), db.medicalReport.count({where:{record_kind:'PRESCRIPTION'}}),
      db.prescription.count(), db.prescription.groupBy({by:['email_status'],_count:{_all:true}}),
      db.medicalReportFile.aggregate({_sum:{size_bytes:true},_count:{_all:true}}),
      db.organPledge.count({where:{organ_type:'Bone Marrow'}}),
    ]);
    // Operational counts only. Never decrypt or return patient identities or clinical content.
    return NextResponse.json({success:true,data:{users,identified,reports,uploadedPrescriptions,doctorPrescriptions,delivery:delivery.map(row=>({status:row.email_status,count:row._count._all})),storageBytes:storage._sum.size_bytes||0,files:storage._count._all,boneMarrowPledges:marrow,configuration:{encryptionConfigured:medicalStorageConfigured(),providerConfigured:Boolean(process.env.DOCTOR_PRESCRIPTION_API_KEY)},updatedAt:new Date().toISOString()}},{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({success:false,message:'Medical operations could not load. Check database migrations and configuration.'},{status:500});
  }
}

export const GET = withActiveAdmin(handleGET);
