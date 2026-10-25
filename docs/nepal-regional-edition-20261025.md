# Nepal regional edition — 25 October 2026

## Release boundary

This release upgrades `/nepal` and Nepal blood-city pages, including existing blood-group/city URLs, general city URLs and country-qualified location URLs. It retains their canonical destinations, metadata titles and existing search engine. Other countries keep their existing presentation. Country-qualified Nepal routes continue to be generated from actual primary/service-city coverage, not a hardcoded list of cities.

The main homepage `/` keeps its existing layout, colors, spacing, animations and responsive behavior. Following the pasted 12-section specification, Nepal **city** pages retain each route's original introduction, statistics, filter hero and donor-card presentation. Login/Register actions are added to the introduction. Their indigo/ivory regional styling begins below the donor cards; published regional images appear in the coverage section. `/nepal` retains the previously implemented country presentation. Other countries and organ-city pages retain their presentation.

The shared hero defaults to its original presentation. A separate, nonvisual `regionalSections` option identifies the filters/cards as two logical sections and retains keyboard activation without opting into different styling. Regional styles are loaded by the relevant route entrypoints and use dedicated classes. Donor modal accessibility supports a named dialog, focus management, Escape and keyboard activation; its appearance and contact behavior are preserved.

## Twelve logical sections

1. City/country introduction, local counts and Login/Register actions.
2. Original blood filters and city search, initialized to the route's city/group.
3. Original donor cards, existing details/contact behavior and pagination.
4. Local coverage, published regional update and count explanations.
5. Homepage invitation: explore the wider directory.
6. Request preparation checklist and copyable message builder — **off by default**.
7. Real Nepal location links and represented blood groups.
8. Accessible practical FAQ accordions.
9. Homepage invitation: explore platform services.
10. Existing practical guides, relevant published articles and attributed safety guidance.
11. Registration invitation with the actual network-count breakdown.
12. Closing homepage invitation.

With request preparation disabled, eleven sections are visible without a blank placeholder. All three homepage invitation buttons link to `/`. The existing bottom menu and floating-plus discovery remain available. City navigation remounts the search with the destination city/group so prior client-side filters do not leak into the next page. Successful regional authentication updates navigation in place without clearing donor filters.

The request-builder module is lazy-loaded only when its visibility switch is enabled. The correction to preserve the first three city sections requires no additional database migration or publication permission. The existing editor and default-off switch from the prior regional implementation remain supported.

### Preserved city presentation verification

The follow-up passed 78 database/authorization/privacy tests, 25 discovery/SEO/unit tests, the regional UI workflow and the production build. Seven HTTP route checks confirm existing canonical destinations, Nepal isolation and anonymous editor rejection. At 390, 768 and 1280 pixels, the city page has no horizontal overflow and retains its city/group search, 16 initial cards and keyboard access. Show More continues through all available matching fallback entries (29 in the synthetic preview). The eleven visible sections become twelve when request preparation is enabled; no hidden placeholder occupies space. The homepage hero's geometry, font sizes, colors and backgrounds exactly match the saved baseline measurements at all three widths; animated screenshot pixels are not treated as a static equality claim.

Updated screenshots and measurements use the `artifacts/nepal-preserved-*` prefix. These are isolated synthetic fixtures, not production donor counts. They supersede the earlier city screenshots that showed refreshed top sections. Production deployment and subsequent Search Console monitoring remain operational steps after the code is pushed.

## Admin workflow

After normal deployment, open **Admin Dashboard → Overview**:

- **Show city donation request section** controls section 6. It defaults to Hidden and persists in the database. Open pages, including embedded city views, receive committed changes through the existing SSE synchronization. It does not affect homepage request forms, patient IDs or discovery visibility.
- Expand **Regional page content & images**. Select Nepal and either all its cities or a specific city override. Existing saved content loads into the editor.
- Write a title and description. Optionally upload up to six JPG/PNG/WebP images, up to 10 MB each. The existing administrator slider uploader optimizes images to WebP. Supply an image description, caption and credit; a source HTTPS URL and event/photo date are optional. Images can be reordered or removed from the page without deleting stored media.
- Confirm publication and save. A published city override replaces the country update for that city. An unpublished city draft falls back to published country content. With no published images, the design uses its abstract graphic; no incident reports or photos are fabricated or automatically published.
- New visits receive published content through server rendering. Ordinary visitors and data managers cannot edit regional content through the admin API. Other countries can be prepared as drafts; their publication remains disabled until their regional edition is enabled.

Regional images use the existing **public** slider-media storage. Draft text is not rendered publicly, but uploaded image URLs are public assets. Use images approved for public use, not private clinical files. Existing protected verification and medical media cannot be attached as regional images.

Request preparation is a local checklist/message tool, not an emergency dispatch or request-publication service. Its inputs stay in page memory, are not submitted or stored, and clear when the component is left. Existing authentication, donor-publication permissions and conditional phone rules remain unchanged.

## Statistics and SEO accuracy

The read-only live public state observed during development reported **11,463 active listings**: **22 active registered accounts**, **10,915 manual donor entries** and **526 community listings**. This did not reveal the total number of inactive plus active accounts. The release does not convert imported listings into registered accounts or invent a larger account count.

Public statistics schema version 3 adds `totalRegisteredAccounts`, `activeRegisteredAccounts` and explicit `countDefinitions`. Existing fields remain compatible. `/statistics` now renders the same source breakdown and machine-readable Dataset markup, with a link to `/site-state.json`. Country blood counts deduplicate service-city accounts and exclude organ-only manual entries; city coverage can legitimately repeat a volunteer across cities.

Nepal pages provide crawlable local links, textual explanations and accurate CollectionPage/Breadcrumb markup. XML sitemap and page modification dates include the genuine redesign revision (`2026-10-25T09:22:00Z`) and relevant publication/withdrawal events. Draft-only edits and identical saves do not create artificial public-update dates. City overrides do not inherit timestamps from country content they do not display.

Search engines and AI services decide when to recrawl, index and refresh their answers. This release supplies clearer current evidence; it cannot guarantee rankings or remove third-party cached misinformation immediately. No new fake reviews, availability promises, medical eligibility claims or empty keyword pages are introduced.

Safety reference used on the pages: [WHO — Blood safety and availability](https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability).

## Database and verification

Migration `20261025090000_regional_city_pages` adds the default-off visibility column and the regional-content table. It does not rewrite donor records, blogs or existing settings. Public modification timestamps are separate from ordinary editing timestamps.

Validation performed:

- 78 isolated database/integration tests, including regional publication, draft inheritance, public-image restrictions, all 72 privileged API method guards and live request visibility.
- Unit coverage for schema validation, publication dates, blog discovery and existing SEO content; donor discovery/ordering regressions.
- Interactive component checks for carousel navigation, copied messages, live visibility, editor loading, city selection, both auth modes and donor-modal keyboard controls; existing blog pagination checks.
- A real migration/deployment audit: 31 populated legacy tables preserved, 21 migrations applied, repeat deployment, 38 Prisma model reads, 50 database-backed GET routes and reconnect persistence.
- Production build with the existing bundled dependencies.
- Browser checks with synthetic data: exact-group filtering, 16 → 32 card loading, local entries first, destination-city defaults, login mode, carousel sizing/navigation, and eleven/twelve sections according to the switch.
- Homepage layout/style measurements match at 390, 768 and 1280 pixels. Raw screenshots contain differing frames of the unchanged animated background/counter and are not represented as identical pixel captures.
- Nepal pages have no horizontal overflow at mobile/tablet sizes. Screenshots and responsive measurements are under `artifacts/nepal-*`.

The reused preview database intentionally has no Prisma migration-history table, so its `/api/health` reports a migration-history error. This is separate from the real deployment audit above, which applies the migrations properly and checks the health route among its successful backend requests. No production database was accessed or modified during development.

## Deployment

```bash
cd /var/www/bloodnet && bash ./deploy-prod.sh
```

The deployment script generates Prisma, builds, applies migrations, validates schema and restarts the app through its existing health-checked process. Then add real regional photos/content from Overview and enable request preparation only when wanted. There are no automatic incident-photo imports or seeded public updates in this release.
