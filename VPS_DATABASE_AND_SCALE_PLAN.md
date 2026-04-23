# BloodNet VPS Database and Scale Master Plan

## 1. Goal
- Keep current Neon database working now.
- Prepare a VPS-ready PostgreSQL architecture that can be switched later with minimal risk.
- Enforce fast pagination, realtime-safe autosave, image optimization, and dashboard data correctness.

## 2. Locked Product Rules
- Homepage donor lists: `16` per load.
- Homepage organ-donor lists: `16` per load.
- All admin/user-management tables: `20` rows per page.
- Profile health + organ updates: debounced autosave (`500-800ms`) with optimistic UI.
- If a user re-enables availability:
  - donor becomes active immediately,
  - ask for optional last donation date,
  - save date only if provided.

## 3. Dual Database Strategy (Now + Later)
- Single schema and API behavior for both environments.
- Environment mapping:
  - Current: `DATABASE_URL` -> Neon
  - Future: `DATABASE_URL` -> VPS PostgreSQL + PgBouncer
- No logic forks by database vendor (both are PostgreSQL).
- Cutover style: short maintenance window.

## 4. Target Infrastructure (VPS)
- PostgreSQL 16
- PgBouncer (transaction pooling)
- Roles:
  - `app_rw` (application read/write)
  - `app_ro` (analytics/read-only jobs)
  - `backup_user`
- Daily base backup + WAL archiving + restore test routine.

## 5. Database Structure Plan

## 5.1 Keep / stabilize current core tables
- `User`
- `AdminUser`
- `OrganRequest`
- `Report`
- `MedicalAidRequest`
- `Blog`
- `Policy`
- `HomepageSlider`
- `PlatformSettings`
- `OtpVerification`

## 5.2 Additions for scale and clarity
- `OrganPledge` (user can pledge multiple organs)
- `VerificationDocument` (prescription/report upload + moderation status)
- `MediaAsset` (all uploaded image metadata + storage key + web URL + dimensions + size)
- `DonorStatusHistory` (active/inactive transitions + optional last donation date event)
- Optional later partitioning candidate:
  - `ClickEvent`
  - `HeatmapEvent`

## 5.3 Index plan
- Users:
  - `(is_active_donor, blood_group, location_country, location_city, updated_at)`
  - `(email)` unique
  - `(mobile)` unique
- Organ pledges:
  - `(organ_type, is_active, updated_at)`
- Moderation queues:
  - `(status, created_at DESC)` for reports/requests/blog reviews
- Analytics:
  - `(page, created_at DESC)`
  - `(device_type, created_at DESC)`

## 6. API Contract Plan
- Public:
  - `GET /api/public/donors?limit=16&cursor=...`
  - `GET /api/public/organ-donors?limit=16&cursor=...`
- Profile autosave:
  - `PATCH /api/users/me/profile`
  - `PATCH /api/users/me/health`
  - `PATCH /api/users/me/organs`
- Admin list/query:
  - `GET /api/admin/users?limit=20&page=1&search=&country=&city=`
- Upload:
  - `POST /api/uploads/image` -> validate -> convert to WebP -> store -> return URL + metadata

All list endpoints must:
- enforce server-side max limit,
- return pagination metadata (`nextCursor` or `totalPages`, `totalItems`).

## 7. Realtime + Performance Plan
- Realtime model: polling + optimistic UI.
- Polling cadence:
  - Homepage aggregates/lists: 10-15s
  - Dashboard moderation queues: 5-10s
- Add query-safe limits and selective fields to avoid overfetching.
- Add lightweight cache headers for read endpoints where safe.

## 8. Image Pipeline Plan (Cloudflare R2 + WebP)
- Upload flow:
  - client upload request
  - server MIME/size validation
  - Sharp conversion to WebP
  - upload to R2
  - store metadata in `MediaAsset`
- Default transforms:
  - avatar/profile: width max 512, quality ~80
  - verification docs: width max 1600, quality ~82
  - blog/slider: width max 1920, quality 82-85

## 9. Migration Plan (Neon -> VPS)
1. Provision VPS DB + PgBouncer.
2. Run schema migrations on VPS.
3. Take Neon snapshot/export and import into VPS.
4. Integrity checks:
   - row counts by table,
   - key sample checksum comparisons.
5. Short write freeze.
6. Final delta sync (if needed).
7. Switch `DATABASE_URL` to VPS DSN.
8. Smoke test:
   - OTP login,
   - profile autosave,
   - homepage donor list,
   - admin/user-management pagination.
9. Reopen writes and monitor.

## 10. Execution Phases

### Phase A: Schema and backend hardening
- Add new models and indexes.
- Normalize statuses/enums.
- Add paginated donor/organ/admin endpoints.

### Phase B: Profile autosave and business rules
- Implement debounced autosave API integration.
- Implement availability re-enable optional date rule.

### Phase C: Dashboard data completion
- Replace remaining mock data with DB-backed queries.
- Add 20-row pagination and server filters everywhere.

### Phase D: Image system
- Implement upload API + WebP conversion + R2 storage.
- Wire verification docs, slider images, blog images.

### Phase E: Analytics and operations
- Stabilize click/heatmap ingestion.
- Add backup/restore scripts and VPS cutover scripts.

## 11. Required Secrets / Config
- Current:
  - `DATABASE_URL` (Neon now, VPS later)
  - `JWT_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- For media:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
  - `R2_PUBLIC_BASE_URL`

## 12. Acceptance Criteria
- Homepage donor and organ lists page in 16-item chunks with load more.
- All dashboard tables paginate 20 rows and remain responsive.
- Profile field edits persist automatically without explicit save.
- Availability re-enable does not block active status if date omitted.
- Image uploads are stored as optimized WebP with metadata.
- Neon works now; VPS cutover can be completed by env switch + migration playbook.
