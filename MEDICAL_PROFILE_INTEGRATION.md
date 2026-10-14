# Medical profiles and doctor prescription delivery

## Deployment order

1. Back up the production database. Deploy the code and database migration together during a maintenance window: the new non-null ID column requires the new signup code.
2. Preserve `MEDICAL_RECORDS_ENCRYPTION_KEY` if medical records already exist. Only for the first medical-feature installation, set a newly generated 64-character hex key. Back it up securely with the database; losing or replacing it makes stored reports and prescriptions unreadable. Generate the initial key with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Set `DOCTOR_PRESCRIPTION_API_KEY` to a separate strong secret of at least 32 characters. Set a stable `DOCTOR_PRESCRIPTION_SOURCE` (default `doctor-portal`). Keep the key only on the two servers, never in browser JavaScript or `NEXT_PUBLIC_*` variables.
4. Keep the existing database, JWT, SMTP, location, and upload settings. Never replace `.env` with the blank example or regenerate an existing JWT/medical key. Install compatible `pg_dump` and `pg_restore` tools; securely retain off-host backups and the original encryption key. Use a supported Node version (Prisma currently requires Node 20.19+, 22.12+, or 24+).
5. Pause all application instances and other writers during a maintenance window **before** replacing `.next` or `node_modules`. The deployment script pauses both local PM2 processes, archives local uploads, installs with `npm ci --include=dev`, checks production configuration/database/SMTP, saves and lists a custom-format database backup, builds, runs `prisma migrate deploy`, and validates the full schema. Never reset, push a schema, reseed users, or recreate the production database. Failures leave services stopped for investigation; do not restart old signup code against the new mandatory ID column.
6. The script recreates stopped PM2 entries from `ecosystem.config.cjs` so stale process-level database settings cannot override the server environment files, then checks HTTP health. It supervises both the website and `bloodnet-prescriptions`, using Next-compatible environment-file loading. For a different hosting platform, run `npm run worker:prescriptions` as a supervised background process. See [the database deployment audit](DATABASE_DEPLOYMENT_AUDIT.md) for verification coverage and staging-clone checks.
7. Verify signup, profile-ID customization, report upload/download, and a prescription delivered from the doctor backend using a designated test patient. Check that the email worker runs and email status becomes `SENT`.

The local checkout has no production `.env`. The migration and code are prepared; no production database or live email recipients were modified during development.

The screenshot's missing-variable error is configuration, not damaged user data. Supply the existing server's `DATABASE_URL`, `JWT_SECRET`, SMTP credentials, and `GEOAPIFY_API_KEY` through a private environment file or the hosting environment. The two new medical secrets must also be configured. The checker validates values without printing credentials, tests database connectivity, can verify SMTP without sending mail, checks profile-ID reservations after migration, and checks decryption of a sample existing report/prescription to catch accidental key replacement. It does not verify every encrypted row or external doctor portal. Blog database reads no longer require unrelated SMTP/map/media settings; database outages show a retry screen without exposing configuration details.

Verification completed: all 18 tests passed against an isolated PostgreSQL database, TypeScript passed, and a complete Next.js production build passed in a temporary checkout with local test settings. Desktop and mobile profile checks used a synthetic patient and synthetic records. These checks do not substitute for verifying the deployment's real SMTP and doctor backend connection.

## Patient identifiers

- Exactly four ASCII letters/digits: `JOHN`, `1234`, or `AB12`. IDs are case-insensitive and stored uppercase.
- Internal user UUIDs and existing relationships are preserved. The migration backfills an ID and a reservation for every existing user.
- Signup reserves a generated ID and creates the user in the same transaction. Database uniqueness prevents duplicate allocations.
- The first customization is available immediately. Each successful customization starts a six-calendar-month cooldown, clamped at month end. An unchanged ID does not restart the cooldown.
- Changing an ID locks the user row, checks the cooldown, reserves the new ID, and updates the user atomically. Concurrent attempts cannot bypass either constraint.
- Retired IDs remain permanently reserved, even after account deletion. Prescription submissions using an inactive/retired ID are rejected rather than redirected.
- The namespace has 36^4 = 1,679,616 IDs. Larger networks will need a longer-ID migration. An ID identifies a patient; it is not a login credential or permission to read records.

Patient endpoints (existing USER session required):

| Endpoint | Purpose |
| --- | --- |
| `GET /api/users/me/profile-id` | Current ID and next allowed change date |
| `GET /api/users/me/profile-id?code=AB12` | Availability, without exposing another user's identity |
| `PATCH /api/users/me/profile-id` with `{ "code": "AB12" }` | Customize the ID |
| `GET /api/users/me/prescriptions` | Patient-owned inbox; optional `cursor` pagination |
| `PATCH /api/users/me/prescriptions/{id}` | Mark a patient-owned prescription read |
| `GET /api/users/me/prescriptions/{id}` | Download the complete printable HTML prescription |
| `GET /api/users/me/medical-reports` | Patient-owned reports; optional `cursor` pagination |
| `POST /api/users/me/medical-reports` | Multipart report details and files |
| `GET /api/users/me/medical-reports/{reportId}/files/{fileId}` | Authenticated patient-owned file download |

## Future doctor website

The doctor website is not part of this repository. Its **server** must authenticate the doctor, verify their registration/authorization, obtain the patient's consent and current BloodNet ID, and call the following endpoint over HTTPS. A patient ID alone is insufficient to submit or read records. The endpoint trusts the configured doctor backend; it does not independently authenticate individual clinicians or query a medical licensing authority.

`POST https://bloodnet.live/api/integrations/prescriptions`

Headers:

```text
Authorization: Bearer <DOCTOR_PRESCRIPTION_API_KEY>
Content-Type: application/json
```

Example payload (synthetic prescription text):

```json
{
  "patientProfileId": "AB12",
  "externalId": "doctor-portal-prescription-unique-id",
  "patientConsent": true,
  "issuedAt": "2026-10-11T10:00:00+06:00",
  "doctor": {
    "name": "Doctor name",
    "registrationNumber": "Doctor registration number",
    "specialty": "Specialty",
    "clinic": "Clinic or hospital"
  },
  "diagnosis": "Clinician-entered diagnosis",
  "medications": [
    {
      "name": "Clinician-entered medicine",
      "dose": "Clinician-entered dose",
      "frequency": "Clinician-entered frequency",
      "duration": "Clinician-entered duration",
      "instructions": "Clinician-entered instructions"
    }
  ],
  "advice": "Clinician-entered advice",
  "followUp": "Clinician-entered follow-up"
}
```

The request is limited to 64 KB; medicine lists allow up to 50 entries. Include medication details or clinical advice. The endpoint resolves only an active patient ID and locks the recipient during submission so an ID change cannot route a prescription to another patient.

Response: `201` for a new record, `200` for an identical retry, with `{ success: true, data: { id, duplicate, emailStatus } }`. The unique external ID is scoped to the configured source. Retrying it with different content returns `409`. Reuse the **same** external ID on network retries; use a new external ID for a genuinely new/corrected prescription. Unknown/retired patient IDs return `404`; invalid input returns `400`; bad credentials return `401`; missing server configuration returns `503`. No patient email or medical history is returned to the doctor backend.

The prescription is committed to the inbox and queued for the supervised email worker, which polls every 30 seconds. The HTTP request does not wait on SMTP. SMTP failure does not lose the prescription: the worker retries with exponential backoff. Inbox refreshes when visible every 30 seconds and on returning to the page. Emails contain the complete prescription and a printable `.html` attachment, matching the downloadable profile version. This is HTML, not a PDF or a digitally signed clinical document. Only the clinician's backend can attest authenticity. Email is an at-least-once delivery channel: the database and a stable message ID reduce duplicates, but a crash after SMTP acceptance and before recording success can cause a retry.

Keep the integration source stable during API-key rotation so retry/idempotency behavior remains intact. Replace the shared key on both servers if it is compromised. Add perimeter request throttling appropriate to the doctor portal's volume.

## Private medical reports

Multipart fields: `title`, `category`, `reportDate` (`YYYY-MM-DD`), `facility`, optional `clinician`, optional `notes`, and one or more `files` fields. The five original categories remain accepted; see the expanded 29-category catalog below.

Files: PDF, JPG, PNG, WEBP; up to five, 10 MB each, 20 MB aggregate. Signature checks reject mismatched content types, and images are re-encoded with metadata stripped. PDFs are served as downloads with sandbox headers. Existing public image-upload and donor-verification routes remain unchanged; the new personal medical report path deliberately does not publish asset URLs.

Report metadata, files, and full prescriptions are encrypted with AES-256-GCM, with patient/record identity bound as authenticated data. Owner checks happen before downloads; admin sessions and other patients cannot read these new records. Responses are uncached. New records are not put in browser local storage. Attachments are stored as encrypted database bytes, which keeps deployment self-contained but increases database storage/backups; a future private object-store adapter can replace this without introducing public file URLs.

## Bone marrow

Bone Marrow is added to the canonical catalog, normalization aliases, bone-shaped icon, SEO slug `bone-marrow`, donor filtering for registered/manual donors, patient pledges, and request/admin forms that use the shared catalog. Existing organ columns are dynamic strings, so no database enum rebuild is required. The same `OrganPledge`, `OrganRequest`, and `ManualOrganDonor` tables store the new value.

## Verification

`npm run test:medical` runs the unit checks. For all database integration checks, set `TEST_DATABASE_URL` to a fresh, empty, loopback PostgreSQL database named `bloodnet_medical_test_<digits>`. The test suite refuses a remote or nonempty database. It replays the previous migrations, inserts an existing user, and then applies the new migration to exercise backfill. Tests cover concurrent ID claims, cooldowns, retired IDs, encrypted files, cross-patient access, duplicate prescriptions, email claiming and retry. Mail is stubbed inside the tests; no real email is sent.

## Medical timeline and document uploads (2026-10-14)

Deploy the additional `20261014090000_medical_record_timelines` migration with `npm run db:migrate:deploy` during the normal backed-up deployment. Do not reset or reseed the live database. It adds document kind, date, an optional upload idempotency key/hash, and timeline indexes. Existing user IDs, encrypted metadata, attachment bytes, and prescriptions are untouched. The first owner-authorized history read populates legacy report dates from encrypted metadata in batches. Keep the original medical encryption key and JWT secret.

- Reports and patient-uploaded prescriptions use the existing private MedicalReport/MedicalReportFile tables. `record_kind` distinguishes REPORT/PRESCRIPTION. Patient uploads are never inserted into the doctor email queue or presented as doctor-delivered prescriptions.
- `POST /api/users/me/medical-reports` retains the existing multipart contract and accepts added optional detail fields. `POST /api/users/me/prescriptions` accepts the same file/details structure, forces prescription kind/category, and requires prescribing doctor name and prescription date.
- Optional details: test/examination name, accession/reference number, sample/specimen type and date, examination site, reason, findings, impression, follow-up date, doctor specialty/registration, results/notes, and up to 100 individually entered test results (test, value, unit, reference range, flag as reported). No OCR, diagnosis, flag inference, or clinical interpretation is performed. The original pages remain available alongside manually entered details.
- 29 report categories cover general labs and blood/urine/stool tests, culture, pathology, molecular/endocrine tests, imaging modalities, cardiac/neurological/lung tests, endoscopy, procedures, discharge/clinical notes, vaccines, allergies, eye/dental, maternal/child health, rehabilitation, and Other. Existing category values remain accepted.
- The browser supports up to ten independent entries per batch, up to five files per entry, 10 MB per file / 20 MB per entry. Additional picker/camera selections append pages; removing or enlarging an image does not submit anything. Each entry has its own clinical details and upload key. Saving uses independent sequential multipart requests, displays progress, removes successful entries, and retains failed entries for retry. Closing the uploader or switching tabs preserves unsaved drafts while the medical panel remains mounted. Reloading/navigating away still discards unsaved in-memory drafts.
- A stable optional UUID `uploadKey` makes identical retries idempotent per patient. A different payload with an already used key returns 409. The hash includes validated details, filenames, MIME types, and original bytes. Both new rows and encrypted attachments commit atomically for each entry. Existing clients without a key remain accepted.
- Selected image previews include a fit-to-screen / actual-size zoom viewer and use temporary local object URLs, revoked on removal or unmount. Native `capture="environment"` offers the rear camera on supported mobile devices and falls back to a file picker elsewhere. JPEG, PNG, WEBP, PDF are supported; HEIC/TIFF require conversion. Animated/multi-page image containers are rejected instead of silently dropping pages; multi-page PDFs are kept intact.
- Images are signature-checked, auto-rotated, resized inside 2400×3200 pixels without enlargement, and encoded as WebP at quality 90, with metadata stripped, before AES-GCM encryption and BYTEA database storage. This follows the existing Sharp/WebP approach, retaining a larger document resolution than public verification images (1600px / quality 82). PDFs remain byte-for-byte unchanged. Compression reduces the tested camera-sized documents substantially; already small/optimized source files are not guaranteed to shrink. Users should check fine text in the preview/download; a medical-image/DICOM diagnostic workflow is outside this document archive.
- `GET /api/users/me/medical-reports/:reportId/files/:fileId?preview=1` serves owner-authorized processed WebP inline with private/no-store and nosniff headers. PDF responses remain sandboxed downloads. File payloads are loaded only on an authorized preview/download, never as part of a timeline query.
- `POST /api/users/me/medical-records/history` accepts JSON `{mode:"reports"|"prescriptions",q?,category?,from?,to?,cursor?}`. Search terms remain out of URLs and ordinary access logs. Results are sorted by actual report/prescription date, newest first, combining doctor-delivered and uploaded prescriptions. Page size is 20; keyset cursors avoid offset pagination. Category/text search decrypts bounded metadata batches (up to 500 rows per request) rather than storing searchable medical content in plaintext. A continuation cursor is returned when more history needs scanning, including when a filtered page is empty. Attachment bytes are excluded from listing queries.
- Original prescription GET/download/read endpoints remain available. `GET /api/users/me/prescriptions?timeline=1` provides the combined dated history for API clients. Existing UUID report cursors are accepted for compatibility; newly returned cursors are opaque.

Validation: 25 medical tests passed on isolated PostgreSQL (24 full-suite checks plus the private-history/PDF endpoint check), covering existing data preservation, clinical-date ordering and search across older records, cursor pagination, multi-page uploads, idempotent retries, image dimension/compression/metadata handling, original PDFs, and cross-patient denial. No production database, real prescriptions, live emails, or device camera were used during development. Native camera hardware behavior still depends on the browser/device.


## Admin operations and analytics release (2026-10-14)

The admin workspace retains all existing menu URLs and adds Medical Operations. Its light/dark preference is stored locally under bloodnet-admin-theme, scoped to the admin workspace. Tool search searches navigation, not patient records. The users table shows the existing four-character profile code and its existing API accepts exact code searches alongside the previous search fields.

GET /api/admin/medical-operations is ADMIN/MANAGER-only and returns aggregate ID adoption, report/uploaded-prescription/doctor-prescription counts, attachment storage bytes, bone marrow pledges and email queue counts. It does not decrypt medical content or return identities, titles, diagnoses or attachments. Configuration flags indicate key presence only, not worker liveness or successful email delivery.

Deploy migration 20261014120000_analytics_coordinates as well as the two medical migrations. It adds nullable event keys/structural target metadata and document coordinate fields. Original click/heatmap history remains intact and legacy points retain coordinate_space=viewport. No reset, reseed or replacement of live users is needed.

The existing POST /api/analytics/clicks accepts additive eventId/session/dimension/coordinate/target fields. New clients write the count and heat point in one transaction; unique event keys make retries idempotent. Old click-only clients and POST /api/analytics/heatmap remain accepted. Counts now include background clicks, grouped under Page background, in addition to controls. Private forms/dialogs use generic labels with an overlay coordinate-space marker; no field values, image bytes, notes or document text enter analytics. Queue retry is bounded; browser blocking or abrupt termination can still prevent delivery.

Heatmap filters aggregate all matching document clicks into weighted cells, not a last-800-point sample. Page/device click totals use AnalyticsClickLog; scrolls are excluded. Average scroll uses each recorded session's maximum depth. Actual same-origin public pages are embedded at desktop/tablet/mobile widths. The preview enables same-origin framing only for public URLs with heatmapPreview=1; private/admin/API routes keep frame denial. Structural element paths and relative click offsets align points to the current rendered controls, with document-normalized coordinates as fallback. Historical layout changes and content changes can still affect placement. Mixed-device mode is explicitly labeled as approximate; device-specific views are preferred.

Previews eagerly mount existing lazy sections, display the guest landing experience, suppress visitor tracking and managed advertising scripts, and block click/submit interaction. The public site keeps its normal lazy mounting, routes and advertising settings. Original viewport-only clicks remain counted as history but are not fabricated onto a full document. Old click-only history likewise cannot be reconstructed into coordinates.

Release verification: 31 tests passed on a fresh isolated PostgreSQL database, including medical privacy, existing-user migration preservation, upload compression/multiple pages, timelines/search, concurrent click retries, transaction rollback, full 2,500-point density, legacy analytics retention, role checks, aggregate-only admin data and concurrent policy initialization. All 18 checked admin GET APIs returned successful responses against the isolated preview. TypeScript and production build passed. Browser checks confirmed two real filter clicks became two count rows/two plotted clicks and aligned with the actual controls in the live source preview. Medical image zoom and admin layouts were reviewed at desktop and mobile widths; no horizontal page overflow at 320px/375px. Device camera hardware and production SMTP/server configuration still require deployment-environment verification.


### Dashboard and heatmap follow-up

The overview and FAQ workspace now use the refreshed shell styling with readable labels, local FAQ filters, real engagement counts and existing workflow links. All original FAQ data fields and CRUD endpoints remain the same.

Heatmap requests now additionally accept days=0 for all time; its UI defaults to this view. Existing 1–365-day requests remain accepted. Public page identifiers accept up to 2,048 characters, including encoded international slugs. Shared homepage content no longer overwrites the URL's page identity: for example, /faq clicks stay under faq. Existing historical rows are not relabeled or guessed. Click tracking mounts with client hydration, while theme synchronization retains its idle scheduling. Selection-specific metrics and overlays are withheld until the matching filter response arrives, preventing old-page points from briefly appearing on another preview.
