import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// This test creates a new isolated database. It never upgrades a supplied database.
test('real deploy preserves every legacy table, matches Prisma, and survives reconnect', { skip: !process.env.TEST_DATABASE_URL, timeout: 180_000 }, async () => {
  const source = new URL(process.env.TEST_DATABASE_URL!);
  assert.ok(['127.0.0.1', 'localhost'].includes(source.hostname));
  assert.match(source.pathname, /^\/bloodnet_medical_test_\d+$/);
  const bootstrap = new Client({ connectionString: source.toString() });
  await bootstrap.connect();
  const database = `bloodnet_deploy_test_${Date.now()}`;
  await bootstrap.query(`CREATE DATABASE "${database}"`);
  await bootstrap.end();
  source.pathname = `/${database}`;
  const url = source.toString();
  const stage = mkdtempSync(path.join(tmpdir(), 'bloodnet-migration-audit-'));
  mkdirSync(path.join(stage, 'migrations'));
  cpSync('prisma/schema.prisma', path.join(stage, 'schema.prisma'));
  cpSync('prisma/migrations/migration_lock.toml', path.join(stage, 'migrations/migration_lock.toml'), { recursive: true });
  const migrations = readdirSync('prisma/migrations', { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name).sort();
  const config = path.join(stage, 'prisma.config.ts');
  writeFileSync(config, `export default { schema: ${JSON.stringify(path.join(stage, 'schema.prisma'))}, migrations: { path: ${JSON.stringify(path.join(stage, 'migrations'))} }, datasource: { url: process.env.DATABASE_URL } };`);
  const cli = (...args: string[]) => {
    const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args, '--config', config], { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8', timeout: 60_000 });
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  for (const name of migrations.filter(x => x < '20261011090000')) cpSync(path.join('prisma/migrations', name), path.join(stage, 'migrations', name), { recursive: true });
  cli('migrate', 'deploy');
  let sql = new Client({ connectionString: url }); await sql.connect();
  const tables: string[] = (await sql.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' ORDER BY tablename")).rows.map(x => x.tablename);
  const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;
  const ids: Record<string, string> = {};
  const pending = new Set(tables);
  // Fill all old tables, including nullable values and foreign-key relationships.
  while (pending.size) {
    let progress = false;
    for (const table of pending) {
      const foreign = (await sql.query(`SELECT kcu.column_name, ccu.table_name AS target, ccu.column_name AS target_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name AND tc.constraint_schema=ccu.constraint_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name=$1`, [table])).rows;
      if (foreign.some(x => !ids[x.target])) continue;
      const columns = (await sql.query("SELECT column_name,data_type,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table])).rows;
      const values = columns.map(column => {
        const name = column.column_name;
        const fk = foreign.find(x => x.column_name === name);
        if (fk) return ids[fk.target];
        if (name === 'id') return randomUUID();
        if (column.data_type === 'boolean') return true;
        if (['integer', 'bigint', 'double precision', 'numeric', 'real'].includes(column.data_type)) return 7;
        if (column.data_type.includes('timestamp') || column.data_type === 'date') return '2026-01-02';
        if (column.data_type === 'jsonb' || column.data_type === 'json') return JSON.stringify({ preserved: true, sample: ['old-data'] });
        if (column.data_type === 'ARRAY') return [];
        if (table === 'AdminUser' && name === 'role') return 'ADMIN';
        if (name === 'blood_group') return 'A+';
        if (name === 'organ_type') return 'Kidney';
        if (name === 'email') return `${table.toLowerCase()}@example.invalid`;
        if (name.endsWith('_url') || name === 'image_url') return `https://example.invalid/${table}.webp`;
        return `legacy-${table}-${name}`;
      });
      const inserted = await sql.query(`INSERT INTO ${quote(table)} (${columns.map(x => quote(x.column_name)).join(',')}) VALUES (${values.map((_, i) => `$${i+1}`).join(',')}) RETURNING id`, values);
      ids[table] = inserted.rows[0].id;
      pending.delete(table); progress = true;
    }
    assert.ok(progress, 'Fixture foreign keys must be acyclic');
  }
  const snapshot: Record<string, unknown> = {};
  const oldColumns: Record<string, string[]> = {};
  for (const table of tables) {
    oldColumns[table] = (await sql.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table])).rows.map(x => x.column_name);
    snapshot[table] = (await sql.query(`SELECT row_to_json(t) AS row FROM (SELECT ${oldColumns[table].map(quote).join(',')} FROM ${quote(table)} ORDER BY id) t`)).rows;
  }
  for (const name of migrations) cpSync(path.join('prisma/migrations', name), path.join(stage, 'migrations', name), { recursive: true });
  await sql.end();
  cli('migrate', 'deploy');
  assert.match(cli('migrate', 'deploy'), /No pending migrations/);
  cli('migrate', 'status');
  cli('migrate', 'diff', '--from-config-datasource', '--to-schema', path.resolve('prisma/schema.prisma'), '--exit-code');
  sql = new Client({ connectionString: url }); await sql.connect();
  try {
    for (const table of tables) {
      const rows = (await sql.query(`SELECT row_to_json(t) AS row FROM (SELECT ${oldColumns[table].map(quote).join(',')} FROM ${quote(table)} ORDER BY id) t`)).rows;
      assert.deepEqual(rows, snapshot[table], `All original columns in ${table} must survive deployment/reconnect`);
      await sql.query(`BEGIN`);
      await sql.query(`UPDATE ${quote(table)} SET id=id WHERE id=$1`, [ids[table]]);
      await sql.query('ROLLBACK');
    }
    const user = (await sql.query('SELECT profile_code FROM "User" WHERE id=$1', [ids.User])).rows[0];
    assert.match(user.profile_code, /^[A-Z0-9]{4}$/);
    assert.equal((await sql.query('SELECT user_id FROM "ProfileIdentifier" WHERE code=$1', [user.profile_code])).rows[0].user_id, ids.User);
    const history = await sql.query('SELECT count(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL');
    assert.equal(history.rows[0].count, migrations.length);
    Object.assign(process.env, { DATABASE_URL: url, NODE_ENV: 'test', JWT_SECRET: randomUUID() + randomUUID(), MEDICAL_RECORDS_ENCRYPTION_KEY: 'ab'.repeat(32), DOCTOR_PRESCRIPTION_API_KEY: randomUUID(), SMTP_HOST: '127.0.0.1', SMTP_USER: 'test@example.invalid', SMTP_PASS: 'test-only', GEOAPIFY_API_KEY: 'test-only', ENABLE_LOCAL_UPLOAD_FALLBACK: 'true', NEXT_PUBLIC_BASE_URL: 'https://example.invalid' });
    const { getPrisma } = await import('../src/backend/config/db');
    const { Prisma } = await import('@prisma/client');
    const prisma = getPrisma();
    try {
      for (const model of Prisma.dmmf.datamodel.models) {
        const delegate = (prisma as unknown as Record<string, { findMany: (args: { take: number }) => Promise<unknown> }>)[model.name[0].toLowerCase() + model.name.slice(1)];
        await delegate.findMany({ take: 1 });
      }
      const { signToken } = await import('../src/backend/utils/jwt');
      const routes = readdirSync('src/app/api', { recursive: true }).map(String).filter(file => file.endsWith('route.ts') && !file.includes('[') && !file.startsWith('location'));
      let checked = 0;
      const failures: string[] = [];
      for (const file of routes) {
        if (!/export (?:async )?function GET|export const GET/.test(readFileSync(path.join('src/app/api', file), 'utf8'))) continue;
        const route = '/api/' + file.replace(/\\/g, '/').replace('/route.ts', '');
        const { GET } = await import(pathToFileURL(path.resolve('src/app/api', file)).href);
        const admin = route.startsWith('/api/admin/') || route.startsWith('/api/management/');
        const request = new Request(`https://example.invalid${route}`, { headers: { authorization: `Bearer ${signToken({ user_id: admin ? ids.AdminUser : ids.User, role: admin ? 'ADMIN' : 'USER' })}` } });
        const response = await GET(request);
        if (response.status !== 200) failures.push(`${route}: ${response.status} ${await response.text()}`);
        checked++;
      }
      assert.deepEqual(failures, []);
      const adminHeaders = { authorization: `Bearer ${signToken({ user_id: ids.AdminUser, role: 'ADMIN' })}`, 'content-type': 'application/json' };
      await sql.query('UPDATE "Blog" SET status=\'PUBLISHED\', author_type=\'USER\', author_id=$1 WHERE id=$2', [ids.User, ids.Blog]);
      for (const file of ['users/[userId]/profile/route.ts', 'admin/users/[userId]/route.ts', 'public/blogs/[slug]/route.ts']) {
        const { GET } = await import(pathToFileURL(path.resolve('src/app/api', file)).href);
        const response = await GET(new Request('https://example.invalid/api/detail', { headers: adminHeaders }), { params: Promise.resolve({ userId: ids.User, slug: 'legacy-Blog-slug' }) });
        assert.equal(response.status, 200, `${file}: ${await response.text()}`);
        checked++;
      }
      const faqBody = { question: 'Does deployment preserve new content?', answer: 'Yes, this synthetic answer must persist in PostgreSQL.', isActive: true, sortOrder: 1 };
      const faqs = await import('../src/app/api/admin/faqs/route');
      const editor = await import('../src/app/api/admin/faqs/[id]/route');
      assert.equal((await faqs.POST(new Request('https://example.invalid/api/admin/faqs', { method: 'POST', headers: adminHeaders, body: JSON.stringify(faqBody) }))).status, 200);
      const saved = (await sql.query('SELECT id, answer FROM "FaqItem" WHERE question=$1', [faqBody.question])).rows[0];
      assert.equal(saved.answer, faqBody.answer, 'API writes must be visible to an independent PostgreSQL connection');
      faqBody.answer = 'An edited answer must also persist in the existing database.';
      assert.equal((await editor.PUT(new Request(`https://example.invalid/api/admin/faqs/${saved.id}`, { method: 'PUT', headers: adminHeaders, body: JSON.stringify(faqBody) }), { params: Promise.resolve({ id: saved.id }) })).status, 200);
      assert.equal((await sql.query('SELECT answer FROM "FaqItem" WHERE id=$1', [saved.id])).rows[0].answer, faqBody.answer);
      assert.equal((await editor.DELETE(new Request(`https://example.invalid/api/admin/faqs/${saved.id}`, { method: 'DELETE', headers: adminHeaders }), { params: Promise.resolve({ id: saved.id }) })).status, 200);
      assert.equal((await sql.query('SELECT id FROM "FaqItem" WHERE id=$1', [saved.id])).rowCount, 0);
      const runCheck = () => spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'src/backend/scripts/deploymentCheck.ts', '--schema', '--existing'], { env: process.env, encoding: 'utf8', timeout: 90_000 });
      const check = runCheck();
      assert.equal(check.status, 0, `Production deployment check: ${check.stdout}\n${check.stderr}`);
      assert.equal((await sql.query("SELECT count(*)::int AS count FROM \"AnalyticsClickLog\" WHERE page='deployment-check'")).rows[0].count, 0, 'Deployment probe must roll back');
      await sql.query('ALTER TABLE "FaqItem" ADD COLUMN deployment_drift_probe TEXT');
      try {
        const drift = runCheck();
        assert.equal(drift.status, 1); assert.match(drift.stderr, /full schema comparison failed/);
      } finally { await sql.query('ALTER TABLE "FaqItem" DROP COLUMN deployment_drift_probe'); }
      const migration = (await sql.query('SELECT id, checksum FROM "_prisma_migrations" LIMIT 1')).rows[0];
      await sql.query('UPDATE "_prisma_migrations" SET checksum=$1 WHERE id=$2', ['0'.repeat(64), migration.id]);
      try {
        const changed = runCheck();
        assert.equal(changed.status, 1); assert.match(changed.stderr, /applied migration has changed/);
      } finally { await sql.query('UPDATE "_prisma_migrations" SET checksum=$1 WHERE id=$2', [migration.checksum, migration.id]); }
      console.log(`Verified all ${Prisma.dmmf.datamodel.models.length} Prisma model reads and ${checked} database-backed GET routes.`);
    } finally { await prisma.$disconnect(); }
    console.log(`Verified ${tables.length} populated legacy tables, ${migrations.length} real migrations, repeat deployment, schema parity, and reconnect persistence.`);
  } finally { await sql.end(); }
});
