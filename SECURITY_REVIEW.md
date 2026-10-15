# Security review — 15 October 2026

This is a source review and local regression assessment, not a certification or an external penetration test. No production database, account, storage bucket or VPS was modified during validation.

## Changes

- Updated Next.js to 15.5.28 and Sharp to 0.35.5 following the [14 October Next.js advisory](https://nextjs.org/blog/nextjs-security-update-october-14-2026). Updated affected direct/transitive dependencies and locked the resolved versions. Full `npm audit` reports zero known vulnerabilities on this date; this does not prove the absence of unknown vulnerabilities.
- OTPs use cryptographic randomness, HMAC-protected database storage, expiry checks and atomic single-use consumption. Existing unexpired plaintext OTPs remain compatible during the transition. PostgreSQL-backed limits cover OTP sends, verification attempts, admin login, uploads and public aid/organ submissions, including concurrent requests across workers.
- JWTs require HS256 and valid session claims. Admin sessions last eight hours; all 40 admin/management route modules check the current administrator record and role on every request. Deleted or demoted administrators immediately lose access. Successful legacy plaintext-password logins upgrade the stored password to bcrypt without changing the password. Database exports require ADMIN.
- API writes reject cross-site browser requests while accepting the configured public origin behind the TLS proxy. Existing authenticated server prescription integrations remain supported. API responses default to no-store.
- Multipart image uploads have a bounded request body, MIME restrictions and a decoded-pixel limit. Guest uploads remain available for the existing medical-aid/organ-request flow; other categories require authentication, and sliders require an active administrator.
- New verification images are compressed to WebP, encrypted before local/R2 storage, and exposed through an authenticated owner/admin endpoint. Verification submissions must reference an image uploaded for that account. Existing medical report/prescription payloads and files retain their encrypted PostgreSQL storage and access controls.
- Blog HTML uses a parser-based allowlist sanitizer; structured data escapes `<`. Public attachment URLs reject executable schemes and embedded credentials.
- PM2 binds Next.js to loopback behind the existing Nginx proxy. This prevents bypassing the proxy and spoofing its trusted client-IP header through a public Node port.

## Validation

- 19 unit/regression tests passed, including JWT claims, CSRF/proxy origins, HTML sanitization, URL validation, body limits, disabled-ad behavior and donor discovery.
- 44 PostgreSQL integration tests passed, including OTP replay, concurrent rate limiting, admin revocation, encrypted image authorization, medical timelines/uploads, shared profile audit, donor ordering/counts and analytics.
- Six simulated profile UI cases passed for patient/admin profiles with complete, empty and legacy values. Opening an audit does not save changes; patient uploads/camera controls and administrator read-only medical access use their appropriate endpoints. Physical phone-camera behavior was not tested.
- The real Prisma deployment test passed against an isolated populated legacy database: 31 legacy tables preserved, 15 migrations applied/reapplied safely, schema parity, 35 Prisma model reads, 45 database-backed GET routes, and persistence after reconnect.
- TypeScript and the optimized Next.js production build passed. HTTP checks against the built application passed for health, home/blog pages, donor/ad APIs, patient/admin authorization, security headers and cross-site write rejection through the configured public origin.

## Deployment and remaining live checks

Use the existing `deploy/deploy.sh` workflow, which installs the lockfile, checks configuration, backs up PostgreSQL/uploads, builds, applies migrations and checks health. No schema migration was added by this security change. Keep the existing DATABASE_URL, JWT_SECRET and MEDICAL_RECORDS_ENCRYPTION_KEY: replacing encryption keys without a migration would make existing records unreadable. Administrators with older sessions may need to sign in again.

The following require production access and have **not** been verified here:

1. Historical verification images already stored at public URLs remain unchanged for compatibility. Their original public copies need a backed-up migration to encrypted storage, reference updates and removal/cache invalidation of the public copies. New-upload protection does not retroactively secure those copies.
2. VPS patches, TLS renewal, firewall rules, PostgreSQL network restrictions/least-privilege credentials, R2 policy and backup restore procedures need host-level review. Keep port 3000 private and preserve Nginx's overwriting of X-Real-IP. If another CDN/proxy is added, configure its trusted client-address chain explicitly.
3. Confirm real email delivery, existing-account login, medical-record reads/uploads, administrator audit and device camera capture after deploying. Local tests use synthetic data and do not send production OTP/email.
4. Existing ad integrations still permit third-party script execution when enabled. The current CSP retains compatibility allowances for those scripts and inline framework markup; it is not a strict nonce policy. Disabled-ad polling regression tests pass. MFA and edge DDoS controls are not implemented by this change.

No website can be guaranteed 100% secure or bug-free. The checks above establish what was tested and identify the live work still needed.
