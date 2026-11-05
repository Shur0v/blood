# India local pages: release evidence

Reviewed source date: 6 November 2026. These checks describe the local release candidate and synthetic rehearsal, not a production deployment.

## Delivered

- Sixty component registrations: three discovery sections and fifty-seven reserved structures. Three visual contact sheets show the rendered library.
- Twenty city guides, six state guides and 146 fixed area recipes. Each default page uses three discovery sections followed by nine distinct reserved sections. Optional visibility remains authoritative.
- Existing eligible India directory pages use the scoped presentation. `/india`, the main homepage and other country implementations remain separate.
- Administrator-only India Local Pages editor with drafts, protected preview, publication, withdrawal, restore, bounded copy, fixed recipes, optional visibility, approved resources and managed-image placements.
- Additive `IndiaEditorialPage` storage and maintenance protection; no donor rewrites, location backfill or automatic publication.

## Verification

- **109 integration tests passed**, none skipped: medical-record privacy, authorization, registration, operations, editorial publication and coverage. The final India test checks metadata/canonical eligibility for all **443 inventoried directory URLs** against matching synthetic database records. This is not a claim that 443 production HTML pages were fetched or published.
- **33 focused tests passed** across India structure/content, donor discovery/ordering, regional configuration, security and SEO. All fifty-seven reserved structures render distinct semantic markup and meaningful copy.
- India editor interaction checks and existing India/Pakistan flow checks passed.
- Additive migration rehearsal passed: **31 populated legacy tables, 31 migrations, 47 Prisma model reads and 65 database-backed GET routes**, repeat deployment, schema parity and reconnect persistence.
- Production build, TypeScript and Platform Guide coverage checked. The reviewed guide catalog contains 418 entries.
- HTTP checks cover all 26 published synthetic guides: status, canonical, one H1, CollectionPage/BreadcrumbList, sitemap inclusion, protected previews/editor and unknown-route rejection.
- Desktop Chromium browser checks cover all 26 guides at 390px and 1440px; Chennai, Kerala and Banda also at 320px and 768px. Checks include twelve default sections, no horizontal overflow, eight representative legacy directory routes, eighteen-card batches, blood filtering, pagination, keyboard contact, state city selection, local demonstrations, registration, empty/error states, private preview, editor, dark mode and regional isolation.
- Draft/publication tests cover unauthorized and cross-site writes, maintenance write blocking, no-op modification dates, withdrawal/restore and rejection of private medical images.

## Visual review and limits

The screenshots contain explicitly synthetic people and directory data from an isolated local PostgreSQL database. Do not run the fixtures against production.

The contact sheets show all sixty registered sections; the pilot screenshots show Chennai, Kerala, Banda and the administrator editor. Country-page captures confirm that the India local class is not applied to the homepage or other regional editions.

Full-page baseline pixels are not identical: recreating the isolated database changed synthetic donor identifiers/order, and the existing automatic discovery content changed some page heights. The India country-page heights matched at the three reviewed widths; differences were concentrated in donor content. Consequently this release does **not** claim a perfect fixed-data pixel comparison across every country. No physical iPhone/Android device or live production deployment was tested here. Run the production smoke checklist below after deployment.

## Data and content boundaries

State figures use reviewed city aliases plus coordinate context and de-duplicate accounts serving several cities. The thirty-kilometre disambiguation radius is not a municipal boundary. State-labelled legacy Odisha records remain unresolved rather than being reassigned to Bhubaneswar or Cuttack. State search shows one mapped city at a time. Organization entries are not individual donors, blood inventory, accreditation or confirmed availability.

The source/recipe inventory records the local briefs and links to official e-RaktKosh, NOTTO and state sources. These are external references, not partnerships. Demonstrations use fictional information and retain no medical data. Prescription/doctor descriptions keep existing availability checks. No first-page ranking or indexing guarantee is made.

## Owner deployment and publication

1. Deploy with the existing `bash ./deploy-prod.sh` workflow; confirm the additive migration and application health checks succeed.
2. Sign in as an active administrator and open Regional Content → **India Local Pages**. No new environment flag is required.
3. Review Chennai, Kerala and Banda using the protected Preview. Check local mappings, source breakdown, useful copy, search/contact behavior and 320px/mobile rendering.
4. Save drafts and explicitly publish reviewed guides. New editorial URLs intentionally return 404 and stay out of public sitemaps until published. Existing eligible directory routes receive the new presentation through the application release.
5. Verify canonicals, sitemap entries, images and styles on the actual domain. Recheck registration, contact privacy, eighteen-card pagination, bottom navigation and unchanged `/india`/homepage/other regional designs on real phones and desktop.
6. Publish remaining guides only after local review. Inspect crawl errors, search impressions and useful completed registrations/contact actions. Do not mass-publish unreviewed guides.

Withdraw removes a new guide from public eligibility; Restore clears its override. Existing directories fall back to applicable regional/local defaults. Retain the additive table and managed assets during rollback; never remove donor data as a rollback shortcut.

## Artifacts

- [Operating guide](../india-local-pages.md)
- [Component copy, local briefs and fixed recipes](content-and-recipes.md)
- [Machine-readable recipes](recipe-inventory.json)
- [Existing directory inventory](existing-route-inventory.json)
- [HTTP verification](http-verification.json)
- [Browser verification](final-browser.json)
- [Contact sheet 1](component-contact-sheet-1.webp), [2](component-contact-sheet-2.webp), [3](component-contact-sheet-3.webp)
- [Chennai desktop](screenshots/after_india_cities_chennai-1440.webp), [mobile](screenshots/after_india_cities_chennai-390.webp)
- [Kerala desktop](screenshots/after_india_states_kerala-1440.webp), [Banda desktop](screenshots/after_india_cities_banda-1440.webp)
- [Administrator editor](screenshots/india-editor-1440.webp)
