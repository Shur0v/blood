import {test} from 'node:test';
import assert from 'node:assert/strict';
import {postgresBackupEnvironment,safeBackupError} from '../src/backend/utils/postgresBackup';

test('backup uses the app database host, user, password and database instead of the shell identity',()=>{
  const value='postgresql://donor%40support:p%40ss%3Aword@127.0.0.1:55439/blood%20net?schema=public&connection_limit=5&sslmode=require&connect_timeout=9';
  const env=postgresBackupEnvironment(value,{NODE_ENV:'test',PGUSER:'root',PGDATABASE:'wrong',PGHOST:'wrong',PGPORT:'5432',PGPASSWORD:'wrong',PATH:'retained'});
  assert.equal(env.PGUSER,'donor@support');assert.equal(env.PGPASSWORD,'p@ss:word');assert.equal(env.PGDATABASE,'blood net');assert.equal(env.PGHOST,'127.0.0.1');assert.equal(env.PGPORT,'55439');assert.equal(env.PGSSLMODE,'require');assert.equal(env.PGCONNECT_TIMEOUT,'9');assert.equal(env.PATH,'retained');
  assert.ok(!Object.values(env).includes(value));
});
test('backup preserves TLS options, encoded socket paths and IPv6 hosts',()=>{
  const env=postgresBackupEnvironment('postgresql://person:secret@[::1]/db?sslrootcert=%2Fprivate%2Fca.pem&sslcert=%2Fprivate%2Fclient.pem&sslkey=%2Fprivate%2Fkey.pem&application_name=backup',{NODE_ENV:'test'});
  assert.equal(env.PGHOST,'::1');assert.equal(env.PGSSLROOTCERT,'/private/ca.pem');assert.equal(env.PGSSLCERT,'/private/client.pem');assert.equal(env.PGSSLKEY,'/private/key.pem');assert.equal(env.PGAPPNAME,'backup');
  assert.equal(postgresBackupEnvironment('postgresql://person:secret@%2Fvar%2Frun%2Fpostgresql/db',{NODE_ENV:'test'}).PGHOST,'/var/run/postgresql');
  assert.throws(()=>postgresBackupEnvironment('https://example.com/db',{NODE_ENV:'test'}));
});
test('backup diagnostics redact both encoded and decoded connection details',()=>{
  const value='postgresql://backup_user:s3cr%40t@db.example.invalid/private_db';
  const message=safeBackupError('Connection '+value+' backup_user s3cr@t db.example.invalid private_db: permission denied',value);
  for(const secret of [value,'backup_user','s3cr%40t','s3cr@t','db.example.invalid','private_db'])assert.ok(!message.includes(secret));
  assert.match(message,/permission denied/);
});
