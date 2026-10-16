import nextEnv from '@next/env';
import { mkdirSync, chmodSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { postgresBackupEnvironment, safeBackupError } from '../utils/postgresBackup';

Object.assign(process.env, { NODE_ENV: 'production' });
nextEnv.loadEnvConfig(process.cwd(), false);
const directory = process.argv[2];
if (!directory || !process.env.DATABASE_URL) throw new Error('Specify a backup directory and configure DATABASE_URL.');
const target = resolve(directory);
mkdirSync(target, { recursive: true, mode: 0o700 });
chmodSync(target, 0o700);
const file = join(target, `bloodnet-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`);
// Keep credentials out of command arguments and logs; pass explicit libpq fields.
const result = spawnSync('pg_dump', ['--format=custom', '--file', file], {
  env: postgresBackupEnvironment(process.env.DATABASE_URL), stdio: ['ignore', 'ignore', 'pipe'],
});
if (result.error || result.status !== 0) {
  console.error('Database backup failed. Deployment stopped.');
  console.error(safeBackupError(result.stderr?.toString() || result.error?.message || 'pg_dump did not complete.',process.env.DATABASE_URL));
  process.exit(1);
}
chmodSync(file, 0o600);
if (statSync(file).size === 0) throw new Error('Database backup is empty. Deployment stopped.');
const verified = spawnSync('pg_restore', ['--list', file], { stdio: ['ignore', 'ignore', 'pipe'] });
if (verified.error || verified.status !== 0) throw new Error('Database backup archive could not be verified. Deployment stopped.');
console.log(`Database backup saved: ${file}`);
