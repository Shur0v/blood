import nextEnv from '@next/env';
import { Client } from 'pg';
import { getAppEnv } from '../config/env';
import { medicalKey, decryptMedical } from '../utils/medicalPrivacy';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Match Next's .env.production.local / .env.local / .env.production / .env precedence.
Object.assign(process.env, { NODE_ENV: 'production' });
nextEnv.loadEnvConfig(process.cwd(), false);

async function check() {
  const env = getAppEnv();
  medicalKey();
  if ((process.env.DOCTOR_PRESCRIPTION_API_KEY || '').length < 32) throw new Error('DOCTOR_PRESCRIPTION_API_KEY must contain at least 32 characters.');
  const base = env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_SITE_URL;
  if (!base || new URL(base).protocol !== 'https:') throw new Error('Set an HTTPS public website URL for production.');
  if (process.argv.includes('--smtp')) {
    const { default: nodemailer } = await import('nodemailer');
    const mail = nodemailer.createTransport({host:env.SMTP_HOST,port:env.SMTP_PORT,secure:true,auth:{user:env.SMTP_USER,pass:env.SMTP_PASS},connectionTimeout:10_000,greetingTimeout:10_000,socketTimeout:15_000});
    try { await mail.verify(); console.log('SMTP connection and authentication checks passed (no email sent).'); }
    finally { mail.close(); }
  }
  if (!process.argv.includes('--database') && !process.argv.includes('--schema')) {
    console.log('Production configuration checks passed (secret values are not printed).');
    return;
  }
  const sql = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10_000, query_timeout: 15_000 });
  try {
    await sql.connect();
    await sql.query('SELECT 1');
    const historyExists = await sql.query("SELECT to_regclass('\"_prisma_migrations\"') AS history");
    const appExists = await sql.query("SELECT to_regclass('\"User\"') AS users");
    if (process.argv.includes('--existing') && !appExists.rows[0].users) {
      throw new Error('Database safety: this upgrade expects the existing BloodNet database, but its User table is missing. Check DATABASE_URL before migrating.');
    }
    if (!historyExists.rows[0].history && appExists.rows[0].users) {
      throw new Error('Database safety: existing tables have no Prisma migration history. Review and baseline the existing schema manually; never reset it.');
    }
    const migrations = readdirSync('prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    const applied = new Set<string>();
    if (historyExists.rows[0].history) {
      const history = await sql.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"');
      for (const row of history.rows) {
        if (row.rolled_back_at) continue;
        if (!row.finished_at) throw new Error('Database safety: an unfinished migration requires manual review before deployment.');
        if (!migrations.includes(row.migration_name)) throw new Error('Database safety: database migration history is ahead of or differs from this release.');
        const contents = readFileSync(join('prisma/migrations', row.migration_name, 'migration.sql'), 'utf8');
        // Match Prisma's tolerance for Windows/Linux line-ending conversion.
        const lf = contents.replace(/\r\n/g, '\n');
        const checksums = [contents, lf, lf.replace(/\n/g, '\r\n')].map(text => createHash('sha256').update(text).digest('hex'));
        if (!checksums.includes(row.checksum)) throw new Error('Database safety: an applied migration has changed. Restore its exact original contents; use a new migration for changes.');
        applied.add(row.migration_name);
      }
    }
    // Check existing encrypted data before migration too: never silently rotate its key.
    const tables = await sql.query("SELECT to_regclass('\"MedicalReport\"') AS reports, to_regclass('\"Prescription\"') AS prescriptions");
    if (tables.rows[0].reports) {
      const reports = await sql.query('SELECT id, user_id, payload FROM "MedicalReport" ORDER BY created_at DESC LIMIT 1');
      for (const row of reports.rows) decryptMedical(row.payload, `report:${row.user_id}:${row.id}`);
    }
    if (tables.rows[0].prescriptions) {
      const prescriptions = await sql.query('SELECT id, user_id, payload FROM "Prescription" ORDER BY created_at DESC LIMIT 1');
      for (const row of prescriptions.rows) decryptMedical(row.payload, `prescription:${row.user_id}:${row.id}`);
    }
    if (tables.rows[0].reports) {
      const files = await sql.query('SELECT f.id, r.user_id, f.payload FROM "MedicalReportFile" f JOIN "MedicalReport" r ON r.id=f.report_id ORDER BY r.created_at DESC LIMIT 1');
      for (const row of files.rows) decryptMedical(row.payload, `report-file:${row.user_id}:${row.id}`);
    }
    if (process.argv.includes('--schema')) {
      if (migrations.some(name => !applied.has(name))) throw new Error('Database safety: pending migrations remain.');
      // Check every model, column, index, and relation against the complete schema.
      const diff = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code'], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 });
      if (diff.error || diff.status !== 0) throw new Error('Database safety: full schema comparison failed. Check database drift with prisma migrate diff before enabling traffic.');
      await sql.query('SELECT event_key FROM "AnalyticsClickLog" LIMIT 0');
      await sql.query('SELECT event_key, coordinate_space, document_w, document_h, target_path, target_x, target_y FROM "AnalyticsHeatmapLog" LIMIT 0');
      await sql.query('SELECT profile_code, profile_code_changed_at FROM "User" LIMIT 0');
      await sql.query('SELECT record_kind, record_date, upload_key, request_hash FROM "MedicalReport" LIMIT 0');
      for (const table of ['ProfileIdentifier', 'MedicalReport', 'MedicalReportFile', 'Prescription']) {
        await sql.query(`SELECT 1 FROM "${table}" LIMIT 0`);
      }
      const invalid = await sql.query(`SELECT COUNT(*)::int AS count FROM "User" u LEFT JOIN "ProfileIdentifier" p ON p.code = u.profile_code AND p.user_id = u.id WHERE u.profile_code IS NULL OR u.profile_code !~ '^[A-Z0-9]{4}$' OR p.code IS NULL`);
      if (invalid.rows[0].count !== 0) throw new Error('Existing user profile ID backfill is incomplete.');
      // The initial pre-build configuration check must not require a generated client.
      const { Prisma } = await import('@prisma/client');
      const permissions = await sql.query(`SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename = ANY($1::text[]) AND NOT (has_table_privilege(format('%I.%I', schemaname, tablename), 'SELECT') AND has_table_privilege(format('%I.%I', schemaname, tablename), 'INSERT') AND has_table_privilege(format('%I.%I', schemaname, tablename), 'UPDATE') AND has_table_privilege(format('%I.%I', schemaname, tablename), 'DELETE'))`, [Prisma.dmmf.datamodel.models.map(model => model.dbName || model.name)]);
      if (permissions.rowCount) throw new Error('Database safety: application role lacks required table read/write permissions.');
      // Exercise an application-table write/read without retaining test data.
      await sql.query('BEGIN');
      try {
        const probeId = randomUUID();
        await sql.query('INSERT INTO "AnalyticsClickLog" (id,page,component,device_type) VALUES ($1,$2,$3,$4)', [probeId, 'deployment-check', 'rollback-probe', 'DESKTOP']);
        const probe = await sql.query('SELECT id FROM "AnalyticsClickLog" WHERE id=$1', [probeId]);
        if (probe.rowCount !== 1) throw new Error('Database safety: database write/read probe failed.');
      } finally { await sql.query('ROLLBACK'); }
    }
    console.log('Production database checks passed.');
  } finally { await sql.end(); }
}

check().catch((error) => {
  // Driver messages may contain connection details. Do not print them.
  console.error('Deployment check failed. Verify required environment variables, database access, migrations, and the original medical encryption key.');
  if (error instanceof Error && (error.message.startsWith('Database safety:') || error.message.startsWith('Invalid environment') || error.message.startsWith('Production media') || error.message.startsWith('Set an HTTPS') || error.message.startsWith('DOCTOR_') || error.message.startsWith('Private medical') || error.message.startsWith('Existing user'))) console.error(error.message);
  process.exitCode = 1;
});
