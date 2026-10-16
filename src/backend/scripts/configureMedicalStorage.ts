import nextEnv from '@next/env';
import { Client } from 'pg';
import { getDatabaseEnv } from '../config/env';
import { configureMedicalStorage } from '../services/medicalStorageSetup';

async function run() {
  const inheritedKey=process.env.MEDICAL_RECORDS_ENCRYPTION_KEY;
  Object.assign(process.env,{NODE_ENV:'production'});
  nextEnv.loadEnvConfig(process.cwd(),false);
  const result=await configureMedicalStorage(process.cwd(),process.env.MEDICAL_RECORDS_ENCRYPTION_KEY,inheritedKey,async()=>{
    const db=new Client({connectionString:getDatabaseEnv().DATABASE_URL,connectionTimeoutMillis:10_000,query_timeout:15_000});
    try {
      await db.connect();
      // Older installations may not have the additive medical tables yet.
      for(const table of ['MedicalReport','MedicalReportFile','Prescription','MediaAsset']) {
        const exists=await db.query('SELECT to_regclass($1) AS relation',[`"${table}"`]);
        if(!exists.rows[0].relation)continue;
        const rows=await db.query(`SELECT EXISTS(SELECT 1 FROM "${table}"${table==='MediaAsset'?" WHERE mime_type='application/x-bloodnet-encrypted-webp'":''}) AS encrypted`);
        if(rows.rows[0].encrypted)return true;
      }
      return false;
    } finally {await db.end();}
  });
  console.log(result.created?'Initial medical-storage key saved privately in .env.production.local. No database records changed. Back up this file securely, then restart the app and prescription worker.':'A valid medical-storage key already exists and was kept unchanged.');
}

run().catch(error=>{
  // Database drivers can include connection details; only show our safe setup errors.
  const message=error instanceof Error&&/^(The shell overrides|Encrypted medical data already exists)/.test(error.message)?error.message:'Medical storage setup failed. Check database access and configuration-file permissions. No secret values are printed.';
  console.error(message);process.exitCode=1;
});
