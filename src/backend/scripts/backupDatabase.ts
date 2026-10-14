import nextEnv from '@next/env';
import { mkdirSync, chmodSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

Object.assign(process.env, { NODE_ENV: 'production' });
nextEnv.loadEnvConfig(process.cwd(), false);
const directory = process.argv[2];
if (!directory || !process.env.DATABASE_URL) throw new Error('Specify a backup directory and configure DATABASE_URL.');
const target = resolve(directory);
mkdirSync(target, { recursive: true, mode: 0o700 });
chmodSync(target, 0o700);
const file = join(target, `bloodnet-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`);
const connection = new URL(process.env.DATABASE_URL);
// Prisma-only URL parameters are not libpq connection options.
for (const key of ['schema', 'pgbouncer', 'connection_limit', 'pool_timeout', 'socket_timeout']) connection.searchParams.delete(key);
// libpq accepts a connection string in PGDATABASE. Keep credentials out of argv/logs.
const result = spawnSync('pg_dump', ['--format=custom', '--file', file], {
  env: { ...process.env, PGDATABASE: connection.toString() }, stdio: ['ignore', 'ignore', 'pipe'],
});
if (result.error || result.status !== 0) {
  console.error('Database backup failed. Install a compatible pg_dump and verify database access. Deployment stopped.');
  process.exit(1);
}
chmodSync(file, 0o600);
if (statSync(file).size === 0) throw new Error('Database backup is empty. Deployment stopped.');
const verified = spawnSync('pg_restore', ['--list', file], { stdio: ['ignore', 'ignore', 'pipe'] });
if (verified.error || verified.status !== 0) throw new Error('Database backup archive could not be verified. Deployment stopped.');
console.log(`Database backup saved: ${file}`);
