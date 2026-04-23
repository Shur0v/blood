import crypto from 'crypto';
import { getPrisma } from '@/src/backend/config/db';

const cleanValue = (value: string | null | undefined): string => (value || '').trim();

const sha256 = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  const realIp = req.headers.get('x-real-ip');
  return realIp?.trim() || 'unknown';
};

export const getFingerprintHash = (fingerprintRaw?: string | null): string | null => {
  const normalized = cleanValue(fingerprintRaw);
  if (!normalized) return null;
  return sha256(`fp:${normalized}`);
};

export const getIpHash = (req: Request): string => {
  const ip = getClientIp(req);
  return sha256(`ip:${ip}`);
};

export const ensureNotRestricted = async (params: {
  userId?: string | null;
  fingerprintHash?: string | null;
  ipHash?: string | null;
}) => {
  const prisma = getPrisma();
  const restricted = await prisma.restrictedIdentity.findFirst({
    where: {
      is_active: true,
      OR: [
        ...(params.userId ? [{ user_id: params.userId }] : []),
        ...(params.fingerprintHash ? [{ fingerprint_hash: params.fingerprintHash }] : []),
        ...(params.ipHash ? [{ ip_hash: params.ipHash }] : []),
      ],
    },
  });

  if (restricted) {
    return {
      blocked: true as const,
      reason: restricted.reason || 'Identity is restricted.',
    };
  }

  return { blocked: false as const };
};

export const recordRiskEvent = async (params: {
  eventType: string;
  reason: string;
  userId?: string | null;
  fingerprintHash?: string | null;
  ipHash?: string | null;
  scoreDelta?: number;
}) => {
  const prisma = getPrisma();
  const scoreDelta = params.scoreDelta ?? 0;

  await prisma.authRiskEvent.create({
    data: {
      user_id: params.userId ?? null,
      event_type: params.eventType,
      reason: params.reason,
      fingerprint_hash: params.fingerprintHash ?? null,
      ip_hash: params.ipHash ?? null,
      score_delta: scoreDelta,
    },
  });

  if (params.fingerprintHash) {
    await prisma.deviceFingerprint.upsert({
      where: { fingerprint_hash: params.fingerprintHash },
      update: {
        last_seen_at: new Date(),
        risk_score: { increment: scoreDelta },
      },
      create: {
        fingerprint_hash: params.fingerprintHash,
        last_seen_at: new Date(),
        risk_score: scoreDelta,
      },
    });
  }

  if (params.ipHash) {
    await prisma.networkFingerprint.upsert({
      where: { ip_hash: params.ipHash },
      update: {
        last_seen_at: new Date(),
        risk_score: { increment: scoreDelta },
      },
      create: {
        ip_hash: params.ipHash,
        last_seen_at: new Date(),
        risk_score: scoreDelta,
      },
    });
  }
};
