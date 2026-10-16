# Completed support and website controls

## Existing-account registration

An email already linked to an account now receives a clear existing-account notice and an OTP to that submitted address. Verification opens the original user ID, even if the visitor started in registration. Submitted registration fields do not replace that person's profile, blood group, phone, service cities or medical records. A phone belonging to another account still produces a conflict when the email is genuinely new.

## Multiple login emails

Open **Admin → All User List → View profile → Account login emails**. Admins can add an address, make a listed address primary, and remove an address. A user can have up to ten login emails. At least one must remain; add a replacement before removing the last address. Removing the primary address promotes a remaining address automatically.

Every listed email authenticates to the same account through OTP. The primary address remains in the existing `User.email` field, so current account and prescription email connections continue to use it. Additional addresses live in the additive `UserLoginEmail` table. Existing primary emails are not rewritten by migration.

Email ownership is checked case-insensitively across primary and additional addresses. Registration and support updates share transaction locks to prevent addresses being assigned to different accounts by concurrent requests. Existing conflicting legacy owners require support resolution rather than silently selecting an account. Pending OTPs are invalidated when emails change, and verification rechecks ownership within the consumption transaction. Previously authenticated sessions continue to use the same user ID.

These endpoints require a currently active admin, reject non-admin access and record support changes with the acting admin ID. Admin list search also finds additional emails. The support operator must verify the customer and address ownership before granting an address access to the account.

## Floating plus button

Open **Admin → Ads Control → Website discovery → Floating plus button**. The switch saves immediately and operates independently of all ad settings. Hiding it also closes an open discovery dialog and restores scrolling. It stays restricted to large screens when enabled.

`PlatformSettings.discovery_visible` persists the choice. The server renders the initial state. A single lightweight EventSource connection per top-level page delivers subsequent changes. PostgreSQL LISTEN/NOTIFY distributes committed updates across application workers, with one shared listener connection per Node process. This feature does not poll or fetch the ad API. Stream heartbeat comments keep normal proxy connections alive; `X-Accel-Buffering: no` disables Nginx response buffering for this response. Existing reverse-proxy rules must allow streaming connections.

Only the public visibility flag is streamed; no email, identity, medical record or administrative data is included. Open pages retain the last known setting during a network interruption and resynchronise when the stream reconnects.

## Recipient form

The existing recipient form now has a subtle repeating paper-grain layer implemented in local CSS/SVG. It adds no image request, intercepts no input and preserves the submission handler and field logic.

## Build reliability

The same seven Inter WOFF2 subsets from the existing successful build are bundled in `public/fonts/inter`, with their original SIL Open Font License. Builds no longer download font assets from Google. The public site still uses Inter with local system fallbacks.

## Deployment and checks

The established deployment must run `prisma generate` and `prisma migrate deploy` before serving the updated code. New migrations:

- `20261016120000_user_login_emails`: additional addresses; existing account data remains intact.
- `20261016140000_discovery_visibility`: a visibility flag defaulting to true, preserving the current visible state.

The earlier additive public-profile migration is also pending in this working tree. Apply the complete migration history; do not reset or reseed production. Preserve the current database connection, JWT secret and medical encryption key.

Verification uses local disposable PostgreSQL databases. The migration audit preserved all original columns in 31 populated legacy tables, applied 18 migrations, checked schema parity and reconnect persistence, read all 37 Prisma models and exercised 48 database-backed GET routes. Integration coverage includes existing-account login, alias login/removal, permission checks, primary-email replacement, private medical records and visibility streaming. UI checks cover the existing-account notice, explicit admin email actions, the independent switch, stream handling and hiding an open discovery dialog.

The live VPS and live customer data were not changed by these checks. After deployment, verify support changes with a controlled test account and confirm the proxy delivers visibility changes to a second browser session.
