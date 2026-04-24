import { z } from 'zod';

const boolFromEnv = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return false;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  GEOAPIFY_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  GOOGLE_TRANSLATE_API_KEY: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().min(1).optional(),
  ),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  ENABLE_LOCAL_UPLOAD_FALLBACK: boolFromEnv,
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cachedEnv: AppEnv | null = null;

const hasR2Bundle = (env: AppEnv): boolean =>
  Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_BASE_URL);

export const getAppEnv = (): AppEnv => {
  if (cachedEnv) return cachedEnv;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }

  const env = parsed.data;
  const isProd = env.NODE_ENV === 'production';
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const r2Ready = hasR2Bundle(env);
  const localFallbackAllowed = !isProd || env.ENABLE_LOCAL_UPLOAD_FALLBACK;

  if (!isBuildPhase && !r2Ready && !localFallbackAllowed) {
    throw new Error(
      'Production media storage is not configured. Provide full R2 env vars or set ENABLE_LOCAL_UPLOAD_FALLBACK=true explicitly.',
    );
  }

  cachedEnv = env;
  return env;
};

export const getPublicBaseUrl = (): string => {
  const env = getAppEnv();
  return env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_SITE_URL || 'https://bloodnet.live';
};

export const getRedactedRuntimeDiagnostics = () => {
  const env = getAppEnv();
  const hasR2 = hasR2Bundle(env);

  return {
    nodeEnv: env.NODE_ENV,
    baseUrl: getPublicBaseUrl(),
    hasDatabaseUrl: Boolean(env.DATABASE_URL),
    hasJwtSecret: Boolean(env.JWT_SECRET),
    hasGeoapifyKey: Boolean(env.GEOAPIFY_API_KEY),
    hasGoogleTranslateKey: Boolean(env.GOOGLE_TRANSLATE_API_KEY),
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      hasUser: Boolean(env.SMTP_USER),
      hasPass: Boolean(env.SMTP_PASS),
    },
    media: {
      provider: hasR2 ? 'r2' : 'local-fallback',
      hasR2,
      hasPublicBase: Boolean(env.R2_PUBLIC_BASE_URL),
      localFallbackAllowed: env.ENABLE_LOCAL_UPLOAD_FALLBACK || env.NODE_ENV !== 'production',
    },
  };
};
