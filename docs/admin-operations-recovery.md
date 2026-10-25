# Administrator operations — admin-operations-v1

Reviewed 26 October 2026 (Asia/Dhaka), baseline 7a678be. This describes reviewed source, not proof of deployment. No production restore, migration, domain transfer or DNS change was performed.

## Owner navigation

- **Platform Guide:** administrator workspace → Platform Guide (`workspace/documentation`).
- **Notifications:** adjacent menu item and header bell.
- **Recovery Center:** Spam Monitor → Backup, Restore & Maintenance.

The guide contains 33 workflows, 130 numbered steps, search, chapters, tooltips, inline disclosures, personal browser reading progress, Switch Directory, migration branch selectors, Markdown export and technical catalog. Managers and ordinary users cannot access these pages/APIs. Reading does not change platform data. The homepage design, donor algorithms and bottom navigation are preserved.

`npm run guide:check` flags changed/new page templates, API groups, services and Prisma models. Review explanations before running `npm run guide:sync`. Matching source hashes do not automatically prove documentation accuracy or deployment.

## Installation order

1. Retain an independently verified PostgreSQL/storage backup and the original medical encryption key. Legacy JSON exports are not replacement-recovery packages.
2. Deploy through `bash ./deploy-prod.sh` in `/var/www/bloodnet`. It applies additive migrations and supervises web, prescription and recovery workers. Deployment refuses active recovery jobs.
3. Install compatible `pg_dump`/`pg_restore`, supported Node 22.12+ or Node 24+, PM2, PostgreSQL and Nginx. Follow current runtime/lockfile checks over obsolete bootstrap examples.
4. Create `/var/lib/bloodnet-operations` outside the public tree and Git checkout, owned by the actual PM2 operating-system account, mode 0700. Web and helper share this directory/owner. Nginx must not read it. Nginx only reads the public notice under `public/runtime-maintenance`.
5. Add the recovery variables from `.env.example` to private server configuration. Preserve `MEDICAL_RECORDS_ENCRYPTION_KEY`. Keep `BLOODNET_RECOVERY_MANAGED_PM2=false` until the isolated rehearsal passes. Never commit secrets.
6. Restart the PM2 ecosystem with updated environment and verify **bloodnet-recovery** stays online. Its read-only progress listener binds loopback 3219; do not expose this port directly. It runs one instance with a PID lock.
7. Merge recovery locations from `deploy/nginx/bloodnet.live.conf` into the actual **HTTPS** server block. Preserve Certbot certificates, redirects, domains, existing proxy headers and unrelated locations. Match real paths/ports. Run `sudo nginx -t` before reloading Nginx. Do not blindly replace the active configuration.
8. Verify maintenance returns public HTTP 503 and Retry-After, while the authenticated console and `/_next/` assets remain reachable. Verify the internal static notice during a controlled Next stop. The job-progress location must reach the loopback helper; requests without the job-specific token return 401.

## Scoped PostgreSQL permissions

Restore requires a dedicated **non-superuser LOGIN CREATEDB** role inheriting the actual application database owner. The application role must own its database/application objects. The recovery URL targets the **same host, port and database** as DATABASE_URL, using the limited recovery role.

In an authorized PostgreSQL operator session, after inspecting real names/ownership, a typical setup is:

```sql
CREATE ROLE bloodnet_recovery LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT;
-- Replace with the existing non-superuser application database owner:
GRANT bloodnet_app TO bloodnet_recovery;
\password bloodnet_recovery
```

Enter its password interactively; never put it in shell history, screenshots or Git. Do not grant `postgres`, server-file roles or server-program execution. Do not reassign unrelated cluster objects. If the app currently uses a superuser or lacks scoped ownership, a database operator must first correct application ownership/permissions. Preflight rejects unsafe/missing staging/cutover privileges before replacement. Extensions, custom schemas, RLS and provider restrictions need their own rehearsal.

## Complete backup

1. Start maintenance in Spam Monitor with a duration (1 minute–7 days), optional public message and current admin password.
2. Stop external writers, duplicate replicas and scheduled jobs. The app guards its own routes/tables; it cannot stop a separate external application or a superuser bypassing triggers.
3. Confirm original medical key, disk space and managed R2 access. Create a recovery package with a separate password of at least 16 characters.
4. The helper drains claimed email work, exports a repeatable-read PostgreSQL snapshot, creates a custom-format dump, counts every non-system application table/schema, copies managed assets and hashes inventory. IDs, sequences, binary values, relationships, migration history and retained database logs are included.
5. Refresh manually. Missing/unreadable managed assets, symlinks, missing medical key or dump failure prevent a complete backup. Only READY packages can download.
6. Reauthenticate to download. The HTTP-only download grant is administrator-bound and expires in ten minutes. Store package/password separately and rehearse restoration. Lost passwords cannot be recovered.

Format: BNREC001, version 1, scrypt-derived AES-256-GCM authenticated encryption, streamed bounded entries, SHA-256 inventory. Private plaintext working directories are removed after jobs or interrupted-helper startup. Journals, encrypted packages and retained cutover assets remain for deliberate operator retention review.

The snapshot contains retained data **at its capture boundary**, not later activity or purged history. It includes managed MediaAsset keys/variants and the application upload tree, including encrypted verification assets. It excludes unrelated applications, unregistered files outside that tree, entire shared buckets, server credentials, unrestricted environment files and external provider history. Public image links that can be identified are recorded as external dependencies; linked external files are not copied.

## Inspection and replacement

1. Install source-compatible code. Migration history must match exactly and destination PostgreSQL cannot be older. Database encoding/locale and original IDs are retained. Configure destination secrets rather than copying obsolete connection strings. Retain the original public media hostname for managed R2 URLs.
2. Upload at most 20 GiB in 4 MiB chunks within 24 hours. Resume with the **same original file**. Two active uploads can be reserved; expired uploads free the slot, but retained encrypted partial files need operator cleanup.
3. Inspection authenticates before extraction and rejects wrong passwords, truncation, unsafe paths, duplicates, checksum/inventory mismatch, incompatible versions and missing prerequisites. R2 packages test scoped read/write/delete access under `other/recovery-check/`. Review snapshot time, all table counts and asset/dependency counts.
4. On an isolated authorized rehearsal environment, configure fixed PM2 web/email names, storage and limited database role, then enable `BLOODNET_RECOVERY_MANAGED_PM2=true`. The helper stops/restarts **bloodnet** and **bloodnet-prescriptions**, and remains running itself.
5. Start maintenance. Enter current admin password, archive password and exact `REPLACE <destination database>` confirmation. Restore **replaces**, rather than merges, destination data.
6. The helper first creates a complete encrypted **safety.bloodnet** with the supplied archive password. It restores an isolated `bn_stage_*` database, verifies all table counts/inventory and representative encrypted records, stages assets, then stops web/email processes.
7. Database renames commit together. The journal records cutover intent/completion; `bn_old_*` and previous local uploads are retained. R2 uses original object keys. Destination-only unused objects are not purged.
8. The original medical key is persisted into private `.env.production.local`; JWT_SECRET rotates, invalidating existing sessions. Services restart and local health must pass. Log in using administrator credentials **from the snapshot**.
9. Verify profiles, private records, images, sequences, notifications, regional pages and workers. Resume deliberately or let the safe unlocked deadline expire. Failed/interrupted restores remain in maintenance beyond the estimate.

No passwords/keys go into URLs, browser persistence or application log messages. A short-lived sessionStorage token grants **non-sensitive progress only**; it cannot download, restore or issue commands. Refresh remains manual.

## Terminal recovery

Use the authorized PM2 operating-system owner in `/var/www/bloodnet`. Preserve the private journal, environment and safety package.

```sh
npm run recovery:operator -- status
npm run recovery:operator -- maintenance-start 60
# Failed restore before cutover/media changes:
npm run recovery:operator -- unlock-before-cutover JOB_UUID
# Failed, stopped restore that touched media or crossed cutover:
npm run recovery:operator -- rollback JOB_UUID
```

Rollback requests the safety password in a hidden interactive prompt. It authenticates safety media, restores retained original database where necessary, rotates sessions and checks health. It retains failed data and leaves maintenance on. Ambiguous cutover state requires manual database inspection; never guess which database to remove. Completed restores cannot be automatically reversed after new writes begin.

After reviewing the service:

```sh
npm run recovery:operator -- maintenance-resume
```

Resume refuses active/failed recovery locks or failed health checks. If restored administrator credentials are unavailable, use the existing authorized server-side staff-access recovery/rotation process. Public APIs never bypass administrator authorization. OS/database outages require provider-console access, the independently retained package/password and a prepared server.

Finished recovery archives/journals are intentionally not auto-deleted. After downloading, rehearsing and approving retention, inspect exact paths before securely removing an obsolete finished job or retained database. Never remove active jobs, the current database, control.key, maintenance state or the only safety package. Upload chunk locks recover after a minute. Disk preflight rejects known shortages, but unexpected disk exhaustion still fails closed and requires operator attention.

## VPS migration tree

1. Inventory deployed commit, runtime/PostgreSQL versions, owners, storage, both private environment files, SMTP, domain/DNS/email records and PM2 writers. Include dependencies configured outside BloodNet.
2. Prepare destination VPS/operator access, supported Node, Git, PM2, Nginx, PostgreSQL/client tools, application database/owner and limited recovery role.
3. Clone `https://github.com/Shur0v/blood.git`; select source-compatible release, install locked dependencies, generate Prisma and apply additive migrations. Configure destination connections/storage, retaining the original medical key.
4. **Local branch:** restore packaged upload tree. **R2 branch:** provide scoped credentials, restore managed objects if changing buckets, retain public media alias and verify private access. Do not copy unrelated shared objects.
5. Freeze all source writers and take final package. Keep source paused. Transfer securely, inspect and restore on destination through its configured helper.
6. Test before DNS using controlled host resolution or restricted origin. Keep delivery/other writers paused to prevent duplicate real messages. Use fictional accounts/records. Verify private decryption, public URLs, login, media, HTTPS and real client-IP forwarding/location.
7. Follow the appropriate independent domain branch below. Preserve email/verification DNS and check A/AAAA behavior.
8. Resume exactly one authoritative production installation. Monitor health and real traffic. Retain old paused server/safety archive. After new writes, rollback needs reconciliation; changing DNS alone can lose updates.

## Four domain branches

- **Point same domain to new VPS:** inventory DNS/TTL; prepare HTTPS; change only intended web A/AAAA/proxy destination; verify apex/www, resolvers, canonical origin, health and forwarded client IP. Preserve mail/TXT records and old paused server.
- **Move ownership between Hostinger accounts:** verify account/registrant access and current eligibility; use the verified provider ownership process; check owner, renewal, DNS provider/nameservers afterward. This does not transfer the app, database or email.
- **Transfer to another registrar:** review TLD transfer/renewal restrictions, registrant email and DNS continuity; unlock/obtain authorization only through provider interfaces; complete receiving registrar process; verify nameservers, DNSSEC, email and renewal. Never store transfer codes here.
- **Change to different domain:** configure HTTPS/canonical origin, trusted origins, cookie scope, provider destinations and email links; retain old domain with permanent path-preserving redirects; verify canonicals, sharing images, sitemaps/feed/robots; update Search Console properties/sitemaps and applicable change-of-address process. Search reprocessing is not immediate or guaranteed.

Provider references/review date: `docs/hostinger-migration-sources.md` and the guide. Recheck current provider screens/eligibility when performing the operation.

## Notification and maintenance limits

Seven event families have consistent card structures; labelled country chips supplement secondary tints. Read receipts belong to each administrator. Reading does not resolve work. Initial load/navigation/explicit Refresh fetches once, without WebSockets, intervals or paid services. Other sessions sync on their next load. Cursor pagination orders time/ID; deleted destinations can become stale.

Exact trigger fields: `ADMIN_EVENT_CATALOG` in `src/lib/adminNotifications.ts`, visible in the technical appendix. Registrations, supported reports/reviews, donor/public-profile changes, publication/configuration and selected restrictions notify transactionally with safe summaries. Prescription failure/recovery deduplicates per prescription; repeated retries do not flood. Bulk imports aggregate by batch/country. Pending reminders retain original submission time. Draft/no-op publication saves, browsing, typing, raw uploads and clinical contents are excluded. Helper recovery/maintenance outcomes use the same feed.

Maintenance combines an absolute server deadline outside the replaced database, database write gate, Nginx fallback and browser-local countdown. Admin recovery stays authenticated. An already-in-flight SMTP send may finish narrowly permitted bookkeeping before snapshot; later processing pauses. BloodNet cannot cancel mail already accepted by the provider. If the helper stops, write gates can remain paused until restart/operator recovery rather than silently reopening.

## Verification

- Full isolated PostgreSQL encrypted replacement: application tables plus separate schema, binary data, relationships, sequences, managed media, original private-record encryption and safety package.
- Migration/reconnect rehearsal: 31 populated legacy tables, 25 migrations, all 44 model reads, 59 database-backed GET routes and exact Prisma schema parity.
- 91 integration checks: authorization/privacy, donor filters/order/pagination, medical delivery, drafts, transactional notifications, individual receipts, bulk aggregation and database maintenance guard.
- Archive/security/maintenance units and component interaction checks: wrong passwords/tampering/unsafe entries, persistent deadlines/locks, scoped grants, guide search/tooltips/export/progress, notification reads/no recurring fetch and maintenance modal.
- A real helper process restart rehearsal confirms that interrupted restoration stays paused past its deadline; only explicitly resolved, unlocked expiry reopens database writes.

Run `npm run test:operations` for archive/guide/maintenance units. The database and helper rehearsals are skipped unless `TEST_RECOVERY_CONTROL_URL` points to an explicitly disposable local PostgreSQL cluster on port 55444. Set `BLOODNET_TEST_PG_BIN` to its client-tool directory where needed; these tests create their own databases and never target production. `npm run test:operations-ui` runs the component interactions. `npm run guide:check` and `npm run build` verify catalog freshness and production compilation.

When PostgreSQL data resides on a different filesystem, configure `BLOODNET_DATABASE_VOLUME_PATH` to an accessible directory on that filesystem. Preflight checks its free-space metadata as well as operation-storage capacity. It never needs permission to read raw database files.

The local rehearsal does not certify production Nginx, role/storage permissions, disk or external SMTP/providers. Repeat a restoration rehearsal against an isolated copy of the actual VPS environment before enabling production restore.
