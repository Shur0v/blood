import { createHash } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { getAppEnv } from '@/src/backend/config/env';
import { DEFAULT_LOCALE, type SupportedLocale } from '@/src/lib/locale';

const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

const hashSource = (source: string) => createHash('sha256').update(source).digest('hex');

const shouldSkipTranslation = (locale: SupportedLocale) => locale === DEFAULT_LOCALE;

const translateViaGoogle = async (text: string, locale: SupportedLocale): Promise<string> => {
  const env = getAppEnv();
  const apiKey = env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return text;

  const query = new URLSearchParams({
    key: apiKey,
    q: text,
    target: locale,
    source: DEFAULT_LOCALE,
    format: 'text',
  });

  const response = await fetch(`${TRANSLATE_ENDPOINT}?${query.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    cache: 'no-store',
  });

  if (!response.ok) {
    return text;
  }

  const payload = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  const translated = payload.data?.translations?.[0]?.translatedText?.trim();
  return translated || text;
};

export const translateTextCached = async ({
  prisma,
  sourceText,
  locale,
  contentType,
  contentVersion,
}: {
  prisma: PrismaClient;
  sourceText: string;
  locale: SupportedLocale;
  contentType: string;
  contentVersion?: string | null;
}): Promise<string> => {
  if (!sourceText) return sourceText;
  if (shouldSkipTranslation(locale)) return sourceText;

  const sourceHash = hashSource(sourceText);
  const version = contentVersion || null;

  const existing = await prisma.translatedContent.findFirst({
    where: {
      source_hash: sourceHash,
      locale,
      content_type: contentType,
      ...(version ? { content_version: version } : { content_version: null }),
    },
    select: { translated_text: true },
  });

  if (existing?.translated_text) return existing.translated_text;

  const translatedText = await translateViaGoogle(sourceText, locale);

  await prisma.translatedContent.create({
    data: {
      source_hash: sourceHash,
      source_text: sourceText,
      locale,
      content_type: contentType,
      content_version: version,
      translated_text: translatedText,
    },
  });

  return translatedText;
};

export const translateObjectFields = async <T extends Record<string, unknown>>({
  prisma,
  locale,
  contentTypePrefix,
  contentVersion,
  obj,
  fields,
}: {
  prisma: PrismaClient;
  locale: SupportedLocale;
  contentTypePrefix: string;
  contentVersion?: string | null;
  obj: T;
  fields: Array<keyof T>;
}): Promise<T> => {
  if (shouldSkipTranslation(locale)) return obj;
  const output = { ...obj };
  for (const field of fields) {
    const value = obj[field];
    if (typeof value !== 'string' || !value.trim()) continue;
    output[field] = (await translateTextCached({
      prisma,
      sourceText: value,
      locale,
      contentType: `${contentTypePrefix}:${String(field)}`,
      contentVersion,
    })) as T[keyof T];
  }
  return output;
};

