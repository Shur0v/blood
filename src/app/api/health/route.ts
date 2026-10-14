import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { getRedactedRuntimeDiagnostics } from '@/src/backend/config/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Status = 'ok' | 'degraded' | 'error';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deep = url.searchParams.get('deep') === '1';
  const startedAt = Date.now();

  let db: Status = 'ok';
  let smtp: Status = 'ok';
  let storage: Status = 'ok';
  let migrationVersion: string | null = null;
  let errorMessage: string | null = null;
  let diagnostics: ReturnType<typeof getRedactedRuntimeDiagnostics> | null = null;

  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    const migrationRows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      ORDER BY finished_at DESC NULLS LAST, started_at DESC
      LIMIT 1
    `;
    migrationVersion = migrationRows[0]?.migration_name || null;
  } catch (error) {
    db = 'error';
    errorMessage = 'Database check failed';
  }

  try {
    diagnostics = getRedactedRuntimeDiagnostics();
    storage = diagnostics.media.hasR2 || diagnostics.media.localFallbackAllowed ? 'ok' : 'error';
    if (storage === 'error' && !errorMessage) {
      errorMessage = 'Storage configuration missing';
    }
  } catch (error) {
    storage = 'error';
    if (!errorMessage) errorMessage = 'Storage diagnostics failed';
  }

  if (deep) {
    try {
      const { transporter } = await import('@/src/backend/utils/mailer');
      await transporter.verify();
      smtp = 'ok';
    } catch (error) {
      smtp = 'degraded';
    }
  }

  const overall: Status = db === 'error' || storage === 'error' ? 'error' : smtp === 'degraded' ? 'degraded' : 'ok';

  return NextResponse.json(
    {
      success: overall !== 'error',
      data: {
        status: overall,
        checks: {
          db,
          storage,
          smtp,
        },
        migrationVersion,
        diagnostics,
        responseTimeMs: Date.now() - startedAt,
      },
      message: errorMessage || undefined,
    },
    { status: overall === 'error' ? 503 : 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

