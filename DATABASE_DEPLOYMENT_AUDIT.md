# PostgreSQL deployment audit — 14 October 2026

The updated source was verified against isolated local PostgreSQL databases. No production database, production user, VPS process, or live email recipient was changed. A live-server guarantee requires checks against that server's configuration and database; VPS access was not available for this audit.

## Findings corrected

- Prisma CLI now uses Next's environment-file loading, matching the website, backup command, and email worker. Existing environment variables keep their normal precedence. No database URL or existing API route was replaced.
- Prisma now maps the Community Donor index to its existing PostgreSQL-truncated name. A complete migration-to-schema comparison is clean without rebuilding that index or touching its rows.
- Database configuration rejects missing, malformed, and non-PostgreSQL URLs.
- Deployment pauses HTTP and queue processes before replacing runtime files. It preserves local uploaded media, takes a custom-format PostgreSQL backup, checks its archive listing, builds before migrating, and checks the complete resulting schema before enabling the app. Development dependencies are explicitly retained because Prisma/tsx are required on the VPS.
- PM2 entries are recreated to avoid retaining stale database credentials from an earlier process configuration. A failed step stops local app/queue processes and requires investigation rather than an unsafe automatic code/database rollback.
- Deployment checks reject an upgrade pointed at a database without the existing User table, missing/unfinished/changed/unknown migration history, pending migrations after upgrade, full-schema drift, incomplete patient-ID reservations, missing application-table permissions, and unreadable sampled medical ciphertext. A real table insert/read is rolled back, leaving no probe row.

Existing migration files were not rewritten. The rollout uses `prisma migrate deploy`; there is no reset, schema push, user reseeding, or replacement database.

## Verification completed

| Check | Result |
| --- | --- |
| Upgrade through the actual Prisma migration CLI | 15 migrations applied successfully |
| Preservation of populated legacy tables | All original column values in all 31 legacy tables matched after upgrade and reconnection |
| Repeat deployment | No pending migrations; no duplicate backfill |
| Entire PostgreSQL schema versus Prisma schema | No difference |
| Generated Prisma reads | All 35 models read successfully |
| Page data route handlers against PostgreSQL | 45 GET handlers returned HTTP 200, covering public content/donors, profile, admin, management, analytics, and medical records |
| Independent connection observes API writes | FAQ create, update, and delete persisted correctly |
| Bad deployment rejection | Altered migration checksum and deliberate schema drift both blocked deployment |
| Private medical/profile/analytics regression suite | 31 tests passed, including existing-user access, encrypted uploads/downloads, timelines, signup, prescription persistence/retries, bone marrow, and atomic click storage |
| Configuration regression suite | 2 tests passed |
| TypeScript / Next production build / deploy shell syntax | Passed; the build also passed against the old schema before the three new migrations, generating all 2,304 static pages |

The route-handler checks use real PostgreSQL with synthetic records and signed synthetic sessions. They do not assert that every possible browser action, external service, production data shape, database size, or failure condition has been reproduced.

## Storage and connection continuity

Application records and new private medical attachment bytes are written/read through PostgreSQL. Private medical images are compressed before encrypted database storage; PDFs retain their original bytes. Existing public images keep the existing storage design: PostgreSQL stores their metadata/URLs while image files remain in R2 or `public/uploads`. Keep the same R2 bucket/domain or local uploads directory; a database backup alone does not contain those public files.

Keep the existing `DATABASE_URL`, `JWT_SECRET`, medical encryption key, SMTP, location, and storage settings. `DATABASE_URL_VPS` is a planning variable, not a second live data connection. Do not change `DATABASE_URL` to a blank or newly created database when upgrading the existing server. All replicas/workers must point at the intended database and retain the same medical key. Back up configuration securely as well as data; do not commit secrets.

## VPS release procedure

1. Review/publish the complete release, including all migration directories and scripts. `deploy/deploy.sh` fetches `origin/main` into `/var/www/bloodnet`; files left only in this local working tree will not be deployed by that script. Preserve any intentional server-only checkout changes before its existing hard reset.
2. Preserve the current server environment, uploaded files, original keys, and an off-host database backup. Install compatible PostgreSQL client tools, PM2, and a supported Node runtime. Rehearse on a restored staging clone of the current live database before the production maintenance window.
3. Pause traffic and all other writers/replicas; run `bash deploy/deploy.sh`. The script manages the two local PM2 processes. This is a maintenance deployment: old signup code must not remain active while the mandatory patient ID column is introduced.
4. Require `npm run deploy:check -- --schema` and `/api/health` to succeed before restoring traffic. Confirm the email worker stays online. Use a designated test account to check signup/login, profile, a report upload/download, a donor/organ search, admin updates, and prescription inbox/email delivery.

The schema check also runs a read-only full Prisma diff. If it reports drift, inspect with `NODE_ENV=production npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma`; resolve the actual discrepancy with a reviewed forward migration or correct schema mapping. Do not reset a populated database or blindly mark failed migrations applied. A database without Prisma history needs an exact-schema baseline review first.

The backup command checks `pg_restore --list`, which detects an unreadable archive but is **not a complete restore rehearsal**. Compatible `pg_dump`/`pg_restore` binaries were not available in this local test environment. On the server, restore the backup into an empty disposable PostgreSQL database, apply this release there, compare row counts and representative encrypted-file downloads with the original, then run the schema check against that clone. Never test restoration into the active database. A rollback after new patient writes requires a reviewed recovery plan; restoring an old backup directly would discard newer writes.

## Repeating the local checks

`npm run test:deployment` requires `TEST_DATABASE_URL` pointing at a loopback PostgreSQL database named `bloodnet_medical_test_<digits>`. It creates a separate uniquely named disposable audit database and uses real `prisma migrate deploy`, populated legacy fixtures, API handlers, schema comparisons, and failure probes. The database role needs `CREATEDB` for this test. It refuses remote hosts and other source database names.

`npm run test:medical` needs a separate empty loopback database with that naming convention; it refuses a populated database. `npm run test:env` needs no database. Never supply a production URL to either test command.
