import { requireActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { getPrisma } from '@/src/backend/config/db';
import { getSessionFromRequest, ADMIN_ROLES } from '@/src/backend/utils/session';
import { decryptMedical, medicalFailure, MedicalError, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { readStoredMedia } from '@/src/backend/services/mediaStorage';

export const runtime='nodejs';
export async function GET(req:Request,{params}:{params:Promise<{assetId:string}>}) {
  try {
    const session=getSessionFromRequest(req);
    if(!session)throw new MedicalError('Unauthorized.',401);
    if(ADMIN_ROLES.includes(session.role as typeof ADMIN_ROLES[number]))await requireActiveAdmin(req);
    const {assetId}=await params;
    const asset=await getPrisma().mediaAsset.findUnique({where:{id:assetId}});
    if(!asset||asset.mime_type!=='application/x-bloodnet-encrypted-webp')throw new MedicalError('Image not found.',404);
    if(asset.owner_user_id!==session.user_id&&!ADMIN_ROLES.includes(session.role as typeof ADMIN_ROLES[number]))throw new MedicalError('Image not found.',404);
    const bytes=decryptMedical(await readStoredMedia(asset.storage_key),`verification-asset:${asset.id}`);
    return new Response(new Uint8Array(bytes),{headers:{...privateHeaders,'Content-Type':'image/webp','Content-Disposition':'inline; filename="verification.webp"','Content-Security-Policy':"sandbox; default-src 'none'"}});
  }catch(error){return medicalFailure(error);}
}
