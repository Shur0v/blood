import nextEnv from '@next/env';
import { setTimeout as wait } from 'node:timers/promises';

async function main() {
  nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
  const { runSandboxBatch, sandboxEnabled } = await import('../services/emergencySms');
  const { readMaintenance } = await import('@/src/lib/maintenanceState.server');
  if (!sandboxEnabled()) throw new Error('Emergency SMS worker requires EMERGENCY_SMS_MODE=sandbox.');
  let running = true;
  process.once('SIGINT', () => { running = false; });
  process.once('SIGTERM', () => { running = false; });
  while (running) {
    try {
      if (!readMaintenance().enabled && await runSandboxBatch()) continue;
    } catch {
      console.error('Emergency SMS simulation batch unavailable; will retry.');
    }
    await wait(2000);
  }
  const { getPrisma } = await import('../config/db');
  await getPrisma().$disconnect();
}

main().catch(() => { console.error('Emergency SMS simulation worker could not start.'); process.exitCode = 1; });
