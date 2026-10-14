import nextEnv from '@next/env';

// A supervised worker, separate from HTTP request lifetimes.
async function run() {
  nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
  const { flushPrescriptionEmails } = await import('../services/prescriptions');
  while (true) {
    try { await flushPrescriptionEmails(); }
    catch { console.error('Prescription email queue unavailable; retrying shortly.'); }
    await new Promise(resolve => setTimeout(resolve, 30_000));
  }
}
void run();
