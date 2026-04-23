import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getAppEnv } from '@/src/backend/config/env';

export type UploadCategory =
  | 'PROFILE'
  | 'VERIFICATION'
  | 'MEDICAL_AID'
  | 'BLOG'
  | 'SLIDER'
  | 'OTHER';

interface TransformConfig {
  maxWidth: number;
  quality: number;
}

const TRANSFORM_CONFIG: Record<UploadCategory, TransformConfig> = {
  PROFILE: { maxWidth: 512, quality: 80 },
  VERIFICATION: { maxWidth: 1600, quality: 82 },
  MEDICAL_AID: { maxWidth: 1600, quality: 82 },
  BLOG: { maxWidth: 1920, quality: 85 },
  SLIDER: { maxWidth: 1920, quality: 85 },
  OTHER: { maxWidth: 1280, quality: 82 },
};

const getR2Client = (): S3Client | null => {
  const env = getAppEnv();
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const getTransformConfig = (category: UploadCategory): TransformConfig => {
  return TRANSFORM_CONFIG[category] || TRANSFORM_CONFIG.OTHER;
};

export const saveOptimizedWebp = async ({
  category,
  optimizedBuffer,
}: {
  category: UploadCategory;
  optimizedBuffer: Buffer;
}): Promise<{ storageKey: string; publicUrl: string }> => {
  const env = getAppEnv();
  const bucket = env.R2_BUCKET;
  const r2Client = getR2Client();
  const fileName = `${randomUUID()}.webp`;
  const datePrefix = new Date().toISOString().slice(0, 10);
  const storageKey = `${category.toLowerCase()}/${datePrefix}/${fileName}`;

  if (r2Client && bucket) {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
      }),
    );

    const publicBase = env.R2_PUBLIC_BASE_URL;
    if (!publicBase) {
      throw new Error('R2_PUBLIC_BASE_URL is required when R2 storage is enabled.');
    }

    return {
      storageKey,
      publicUrl: `${publicBase.replace(/\/$/, '')}/${storageKey}`,
    };
  }

  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  const fullDir = path.join(uploadsRoot, category.toLowerCase(), datePrefix);
  await mkdir(fullDir, { recursive: true });
  const fullPath = path.join(fullDir, fileName);
  await writeFile(fullPath, optimizedBuffer);

  return {
    storageKey: `local/${storageKey}`,
    publicUrl: `/uploads/${category.toLowerCase()}/${datePrefix}/${fileName}`,
  };
};
