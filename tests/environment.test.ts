import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDatabaseEnv, getAppEnv } from '../src/backend/config/env';
import { GET as health } from '../src/app/api/health/route';

test('database reads require only database settings; missing credentials still fail closed', async () => {
  const keys = ['DATABASE_URL','JWT_SECRET','SMTP_HOST','SMTP_USER','SMTP_PASS','GEOAPIFY_API_KEY'];
  const saved = Object.fromEntries(keys.map(key => [key,process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    assert.throws(getDatabaseEnv, /Database configuration/);
    process.env.DATABASE_URL = 'postgresql://test@localhost/test';
    assert.equal(getDatabaseEnv().DATABASE_URL, process.env.DATABASE_URL);
    process.env.DATABASE_URL = 'https://example.invalid/not-a-postgresql-database';
    assert.throws(getDatabaseEnv, /Database configuration/);
    process.env.DATABASE_URL = 'not-a-connection-string';
    assert.throws(getDatabaseEnv, /Database configuration/);
    process.env.DATABASE_URL = 'postgresql://test@localhost/test';
    assert.throws(getAppEnv, /Invalid environment configuration/);
    delete process.env.DATABASE_URL;
    const response = await health(new Request('http://localhost/api/health'));
    assert.equal(response.status,503);
    const body = await response.json();
    assert.equal(body.success,false);
    assert.equal(body.data.diagnostics,null);
  } finally {
    for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
});

test('the supplied empty optional R2 URL supports explicit local storage', () => {
  Object.assign(process.env, {NODE_ENV:'production',DATABASE_URL:'postgresql://test@localhost/test',JWT_SECRET:'x'.repeat(32),SMTP_HOST:'localhost',SMTP_USER:'test@example.invalid',SMTP_PASS:'test',GEOAPIFY_API_KEY:'test',R2_PUBLIC_BASE_URL:'',ENABLE_LOCAL_UPLOAD_FALLBACK:'true'});
  assert.equal(getAppEnv().R2_PUBLIC_BASE_URL,undefined);
});
