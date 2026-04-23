import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { getSessionFromRequest } from '@/src/backend/utils/session';
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
    const formData = await req.formData();
    const rawFile = formData.get('file');

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ success: false, message: 'No image file provided.' }, { status: 400 });
    }

    const category = parseCategory(String(formData.get('category')));
    const mimeType = rawFile.type;

    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json({ success: false, message: 'Unsupported image format. Use JPG, PNG, or WEBP.' }, { status: 400 });
    }
    if (rawFile.size > MAX_BYTES) {
      return NextResponse.json({ success: false, message: 'Image exceeds 10MB limit.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await rawFile.arrayBuffer());
    const transformConfig = getTransformConfig(category);

    const pipeline = sharp(fileBuffer).rotate();
    const metadata = await pipeline.metadata();
    const resized = pipeline.resize({
      width: transformConfig.maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    });
    const optimizedBuffer = await resized.webp({ quality: transformConfig.quality }).toBuffer();
    const outputMeta = await sharp(optimizedBuffer).metadata();

    const { storageKey, publicUrl } = await saveOptimizedWebp({
      category,
      optimizedBuffer,
    });

    const asset = await getPrisma().mediaAsset.create({
      data: {
        owner_user_id: session?.role === 'USER' ? session.user_id : null,
        category,
        storage_key: storageKey,
        public_url: publicUrl,
        mime_type: 'image/webp',
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
        mimeType: asset.mime_type,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to process image upload.' }, { status: 500 });
  }
}
