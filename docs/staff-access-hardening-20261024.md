# Staff access hardening

The administrator workspace and manager workspace have moved to separate high-entropy routes below `/private/`. Their existing navigation, tools and database-backed workflows are retained. All 24 workspace pages sit below server-side session/role guards; the administrator workspace requires ADMIN, while the manager workspace permits MANAGER and ADMIN. Each login endpoint accepts only its designated role. No real access links are exposed by the old portal pages.

All 70 exported administrator/management API methods retain the shared active-account guard. It now checks a keyed credential version bound to the account's database ID and stored password hash on every privileged request. Password changes, account removal and role changes invalidate existing sessions. Administrator API routes require ADMIN; management routes retain their existing staff permissions. The session refresh endpoint also checks the credential version and cannot renew revoked sessions. Existing privileged sessions without the new version require a new login after deployment. Ordinary-user login and sessions remain unchanged.

Real login retains durable database-backed IP/account rate limits, bcrypt hashes, secure HTTP-only cookies, origin checks and eight-hour staff sessions. A conditional update prevents a concurrent password/role change from minting a valid session using the previous password. Legacy plaintext rows are upgraded on successful login for compatibility; the rotation command replaces both selected accounts with bcrypt hashes.

`/admin`, `/admin-dashboard` and `/dashboard`, including their old nested paths, display a simple decoy sign-in form. Submission clears the fields, waits 150 seconds in the browser and displays “Access denied.” Credentials are never sent, stored or validated by the decoy. Leaving cancels the timer. The old login API denies access immediately and does not query the database. The delay is presentation only, not a server resource reservation or an authentication boundary.

Private/legacy routes are noindex and no-store. Private paths are excluded from the homepage continuation, advertising, internal interaction tracking and Simple Analytics page collection. The root landing-page design and global bottom-menu design remain unchanged.

## Production credentials

No password is committed to the repository, embedded in client code or included in this document. The new account IDs/passwords are supplied separately to the owner. Production credentials cannot be changed from this workspace without live server access.

After deploying the pushed code, run `npm run access:rotate` from `/var/www/bloodnet`. For each role, enter the current ID (blank only when exactly one account has that role), the new ID and the new password twice. Password input is hidden and is not placed in shell history. The command requires different IDs/passwords, passwords of at least 24 characters and at most 72 UTF-8 bytes, and an unambiguous existing account per role. Both changes commit in one transaction; any validation/update error rolls both back. Existing primary keys, related records and roles are retained. No migration or new environment variable is required. Keep any independently maintained staff provisioning credentials in sync before re-running provisioning scripts.

The URLs reduce casual discovery; authorization, credential verification and rate limiting remain the security boundary.

## Verification

- All 73 database integration checks passed: account rotation/rollback, credential revocation, login race protection, role isolation and exhaustive anonymous/ordinary-user denial for all 70 privileged API methods, plus existing medical/privacy/publication/discovery tests.
- Production HTTP: all 24 private workspace pages reject anonymous requests; six representative old paths show only the decoy; both real logins succeed for their own role; managers cannot access administrator pages/APIs; password changes immediately revoke API/page access.
- Decoy UI test: 150-second timer, input clearing, denied result, no network submissions and timer cleanup. Production-mode browser also reached the denied result after the real wait; evidence in `artifacts/staff-decoy-denied-20261024.png`.
- Deployment audit: all 37 Prisma model reads and 49 database-backed GET routes passed, with 31 populated legacy tables, 19 real migrations, repeat deployment, schema comparison and reconnect persistence.
- Security/environment checks and production build passed.

All test writes used guarded, isolated local databases. Live production credentials and data were not modified by these tests.
