# USA edition — operating and release guide

Reviewed 2026-11-05. This describes repository behavior, not proof of a production deployment.

## Scope and presentation

`/us` uses the USA-only navy, blue, white and red composition. It has twenty default sections. Existing public USA directory, blood-group, country-qualified blood/organ and network pages receive scoped presentation after their directory country resolves to United States. Their existing metadata, canonical destinations and coverage eligibility remain authoritative. `/usa` and `/united-states` retain permanent redirects to `/us`.

The main homepage, other country editions, bottom navigation and donor query/order algorithms are unchanged. USA cards identify registered accounts, manual individual entries and organization listings. A platform review flag does not establish accreditation, affiliation, blood inventory or availability.

The new curated state/city guides are editorial records, separate from donors and existing coverage-gated directories. New installations and migrations do not create published guides. The preview fixture publishes synthetic guides **only in a guarded localhost test database**.

## Publish a country or area update

1. Sign in as an active administrator. Open Overview, then **USA edition · country, states & cities** (`#editor-usa`, alongside the existing regional editor).
2. Select country, California, or a curated city. Update bounded introduction copy, section text, visibility and approved presentation variants. Additional regional palette/FAQ/gallery settings retain their existing editors.
3. For an area, review its geographic context and official source. Add accurate local context; at least 80 characters are required for publication. Do not imply local donors, medical services or partnerships that have not been verified.
4. Keep the fixed hero/search/results; select nine different reserved sections. The default recipes are reviewed and deterministic. Optional-section visibility is authoritative; hidden sections are not replaced with filler.
5. Choose approved guidance resources. Add up to two existing public marketing-image placements through the managed-image control; private records are rejected. Image attribution and contextual descriptions use the existing image workflow.
6. **Save draft**, then **Open saved draft preview**. Preview requires current administrator authorization and is excluded from indexing. Unsaved form edits do not appear in that preview.
7. Review mobile/desktop, coverage definitions, service availability, links and contact behavior, then **Publish reviewed page**. Publish California and Las Vegas as pilots before expanding.
8. **Withdraw** an area to return its public route to 404 and remove it from sitemaps. **Restore defaults** resets its draft and unpublishes the area. The country route remains available with default presentation when its customization is withdrawn/restored.

Published area values override published USA country values, which override applicable existing regional settings, then defaults. Per-section fields merge individually. Explicit section visibility can override inherited optional-section visibility. Regional gallery hiding also hides managed images. An unchanged publish does not manufacture a new public modification date.

## Coverage and geography

Four separate counts are shown: active registered accounts serving the area, active manual entries, active organization listings, and all registered accounts worldwide. Primary/service-city accounts are de-duplicated. Worldwide accounts include inactive accounts. A failed aggregate query shows an unavailable state rather than sample figures.

State coverage aggregates only reviewed Los Angeles, San Francisco and San Diego mappings; it does not infer records from a “California” text search. City references use reviewed GeoNames IDs, exact city aliases, country and a conservative coordinate-distance check (75 km) to reject obvious same-name cities. This is **not an administrative-boundary polygon or precise neighborhood check**. Missing/unconfirmed coordinates are excluded from local aggregates and explained; country totals retain them. Existing donor discovery still uses its original stored city/search behavior, so broader results retain their actual locations.

California search selects one mapped city at a time. No organization-only blood-group pages are manufactured. An empty editorial guide explicitly states that no local listings are recorded, provides official resources and invites voluntary registration. A listing is never described as a guaranteed donor, blood unit or confirmed response.

## Services and measurement

The existing registration/login, filters, show-more, contact dialogs, masking, account permissions and medical tools are reused. Medical demonstrations are labelled fictional. Collecting services determine donation eligibility. Participating clinician delivery and doctor actions retain existing service configuration; planned capabilities have no invented working destination.

Aggregate events distinguish invitation activation, registration start, successful new USA-account creation, directory exploration and contact initiation. The browser's account-access success is not counted as a new registration. Server completion is recorded once inside the account transaction. These events contain approved page/component identifiers and device category, not names, contact details, medical contents or precise locations. Protected preview actions are excluded from USA browser action tracking.

## Deploy and rollback

The additive migration `20261106090000_usa_editorial_pages` creates `UsaEditorialPage` and its maintenance write guard. It neither backfills nor alters donor records. Use the normal deployment, including migrations:

```bash
cd /var/www/bloodnet
bash ./deploy-prod.sh
```

No new external service, paid API or environment flag is required for this edition. Existing neighborhood flags are unrelated. Verify `/us`, both aliases, authentication, source-labelled cards and current styles. New area URLs intentionally return 404 until published through the editor. Review production data before publishing; development screenshots use synthetic data and do not establish actual coverage.

For content rollback withdraw an area or restore its defaults. Retain the additive table when rolling code back; do not delete donor data or drop tables. Existing published regional settings and retained image assets remain available. No production restore, DNS change or VPS migration is performed by this release.

## Verification and limitations

Automated checks cover the 20/50 component registry, all fourteen 3+9 recipes, all fifty reserved sections, deterministic uniqueness, schema bounds, authorization/origin rejection, draft boundaries, managed-image restrictions, no-op dates, count de-duplication and same-name geography. An isolated PostgreSQL migration rehearsal checks existing rows, model reads and API queries. Registration and medical tests exercise transaction behavior.

The browser harness targets a localhost-only seeded production build and checks 320/390/tablet/desktop layouts, one heading hierarchy, no horizontal overflow, filters, pagination, keyboard contact, login, private preview and empty/error responses. It captures supported theme/reduced-motion layouts and other regional editions. Existing HTTP snapshots verify unchanged content/metadata/schema/links where a baseline route was eligible; baseline 404 routes stay 404. Browser screenshots are not a substitute for a real-device/network production check, and regional isolation checks are not a claim of a pixel-identical full-page comparison.

Commands: `npm run test:usa`, `npm run test:usa-ui`, `npm run test:discovery`, `npm run test:regional`, `npm run test:seo`, `npm run test:security`, `npm run test:medical`, `npm run test:deployment`, `npm run guide:check`, `npx tsc --noEmit`, `npm run build`. Database tests require their documented isolated PostgreSQL configuration. `node tests/usa-browser.mjs` requires the isolated preview fixture; never run its interaction tests against production. `node tests/usa-seo-preservation.mjs` compares captured before/after HTTP fixtures.

See [component and recipe inventory](usa-content-review.md) and the administrator Platform Guide for section references and publication controls. Search eligibility and unique design do not guarantee indexing, rankings, registrations or medical outcomes.

The [USA search follow-up](usa-search.md) explains city-specific search intent, healthcare-content sources, metadata improvements and owner verification in Search Console. The [intent inventory](usa-release/search-intents-2026-11-06.json) records the intended queries without claiming measured volume or rankings.
