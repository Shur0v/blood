import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { getSessionFromRequest } from '@/src/backend/utils/session';
import { requireActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { ADMIN_ROLES } from '@/src/backend/utils/session';
import { boundedBody } from '@/src/backend/utils/boundedBody';
import { MedicalError, encryptMedical } from '@/src/backend/utils/medicalPrivacy';
import { randomUUID } from 'node:crypto';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { securityRateLimit, securityFailure } from '@/src/backend/utils/security';
import { getIpHash } from '@/src/backend/utils/risk';
import { getTransformConfig, saveOptimizedWebp, type UploadCategory } from '@/src/backend/services/mediaStorage';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;

const CategorySchema = z.enum(['PROFILE', 'VERIFICATION', 'MEDICAL_AID', 'BLOG', 'SLIDER', 'OTHER']);

const parseCategory = (value: string | null): UploadCategory => {
  const parsed = CategorySchema.safeParse(value || 'OTHER');
  if (!parsed.success) {
    return 'OTHER';
  }
  return parsed.data;
};

const isAllowedMimeType = (mimeType: string): boolean => {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
};

export async function POST(req: Request) {
  try {
    const session = getSessionFromRequest(req);
    if(session && ADMIN_ROLES.includes(session.role as typeof ADMIN_ROLES[number]))await requireActiveAdmin(req);
    await securityRateLimit('image-upload-ip',getIpHash(req),60,60*60*1000);
    const bytes=await boundedBody(req,MAX_BYTES+128*1024);
    const formData = await new Response(bytes as BodyInit,{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData();
    const rawFile = formData.get('file');

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ success: false, message: 'No image file provided.' }, { status: 400 });
    }

    const category = parseCategory(String(formData.get('category')));
    if(!session&&category!=='MEDICAL_AID')throw new MedicalError('Authentication required for this upload.',401);
    if(category==='SLIDER'&&(!session||!ADMIN_ROLES.includes(session.role as typeof ADMIN_ROLES[number])))throw new MedicalError('Administrator access required.',403);
    if(!session)await securityRateLimit('guest-image-upload-ip',getIpHash(req),10,60*60*1000);
    let ownerUserId=session?.role==='USER'?session.user_id:null;
    const targetUserId=formData.get('targetUserId');
    if(category==='VERIFICATION'&&typeof targetUserId==='string'&&targetUserId) {
      if(!session||!ADMIN_ROLES.includes(session.role as typeof ADMIN_ROLES[number]))throw new MedicalError('Administrator access required.',403);
      if(!await getPrisma().user.findUnique({where:{id:targetUserId},select:{id:true}}))throw new MedicalError('User not found.',404);
      ownerUserId=targetUserId;
    }
    const mimeType = rawFile.type;

    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json({ success: false, message: 'Unsupported image format. Use JPG, PNG, or WEBP.' }, { status: 400 });
    }
    if (rawFile.size > MAX_BYTES) {
      return NextResponse.json({ success: false, message: 'Image exceeds 10MB limit.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await rawFile.arrayBuffer());
    const transformConfig = getTransformConfig(category);

    const pipeline = sharp(fileBuffer,{limitInputPixels:40_000_000,pages:1}).rotate();
    const metadata = await pipeline.metadata();
    const resized = pipeline.resize({
      width: transformConfig.maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    });
    const optimizedBuffer = await resized.webp({ quality: transformConfig.quality }).toBuffer();
    const outputMeta = await sharp(optimizedBuffer).metadata();

    const assetId=randomUUID(),privateVerification=category==='VERIFICATION';
    const storedBytes=privateVerification?encryptMedical(optimizedBuffer,`verification-asset:${assetId}`):optimizedBuffer;
    const { storageKey, publicUrl } = await saveOptimizedWebp({
      category,
      optimizedBuffer:storedBytes,
      encrypted:privateVerification,
    });

    const asset = await getPrisma().mediaAsset.create({
      data: {
        id:assetId,
        owner_user_id: ownerUserId,
        category,
        storage_key: storageKey,
        public_url: privateVerification?`${getPublicBaseUrl()}/api/uploads/image/${assetId}`:publicUrl,
        mime_type: privateVerification?'application/x-bloodnet-encrypted-webp':'image/webp',
        width: outputMeta.width || metadata.width || null,
        height: outputMeta.height || metadata.height || null,
        size_bytes: optimizedBuffer.byteLength,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: asset.id,
        url: asset.public_url,
        storageKey: asset.storage_key,
        width: asset.width,
        height: asset.height,
        sizeBytes: asset.size_bytes,
        mimeType: 'image/webp',
      },
    });
  } catch (error) {
    return securityFailure(error);
  }
}
