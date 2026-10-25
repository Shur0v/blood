# Public content, regional discovery and image release — 26 October 2026

## Administration

- Dashboard Overview retains the separate homepage and regional editors and adds **Public service content & regional availability**. Service/help content has separate draft, publish and restore actions, bounded plain-text sections and internal links. Saving a draft does not change public pages.
- Regional country defaults and city overrides remain independent. Only actual recorded locations can receive service settings. Verified booking/contact destinations require an HTTPS URL, review date and internal verification note; the note never enters public output. An explicit city override can disable country-level services.
- Slider, regional and blog editors share **Upload**, **Import from URL** and **Reuse existing image**. New assets require reuse permission and descriptive information. Informative placements need alt text; decorative placements use empty alt. Alt text/captions belong to each placement, while credits, source and license belong to the shared asset.
- Attaching an image changes the editor form; save/publish the page to make it visible. Updating shared asset information is a separate, explicit operation affecting published uses. URLs remain stable. Legacy image URLs remain supported and are not automatically imported or replaced.
- Overview includes aggregate account/record totals, accepted partner prescriptions, delivered prescription emails and recorded public action initiations. A click does not establish a reply, appointment or completed consultation.

## Public behavior

The homepage retains its default composition, filter behavior, animations and responsive layout. Its existing statistics widgets now use actual database totals and accurate labels. Registered accounts, active registered donors, manual entries and community listings are separate figures; a global total is never represented as a local country total. There is no hardcoded “11,000 registered users” claim.

City-only `/blood/[city]`, blood-group `/blood/[group]/[city]` and country-qualified donor-city routes use the same regional search renderer. City-only pages start with all groups and the named city in the search field. Blood-group pages retain their group. The country palette and published search copy apply to filter/cards, independently of the main homepage. Existing local-first/newer registered donor ordering, broader suggestions, category retention, service cities, cursors and private-coordinate protections are unchanged.

City pages provide request preparation, matching explanations, a clearly fictional profile demonstration, prescription delivery expectations, gated doctor options, accurate local participation, related locations/reading and FAQs. Country pages use actual coverage, published updates and honest explanations when local blood coverage is absent. Organ directory/request routes now render purpose-specific discovery rather than a full homepage placeholder.

New public pages: `/medical-profile`, `/prescriptions`, `/medical-reports`, `/doctor-appointments`. Contextual invitations link donor profiles and articles to relevant features. Existing article bodies, URLs and clinical publication dates are retained. Help pages accept purpose-specific published additions. Terms/privacy remain policy-focused. The bottom navigation remains available; public pages do not append a duplicate full homepage.

## Image and privacy boundaries

- Public image work accepts still JPEG, PNG and WebP, at most 10 MiB and 40 million decoded pixels. Derivatives are WebP at useful widths through 1920 pixels without enlargement, with decoded dimensions and responsive sources. Public derivatives strip embedded GPS/device metadata; supplied attribution is preserved separately.
- URL imports accept public HTTPS only, no credentials or nonstandard ports, with a ten-second total deadline and at most three redirects. Every destination is resolved and checked; the connection is pinned to an approved IP to prevent DNS rebinding. Private, loopback, special and transition networks are rejected. No cookies or authorization headers are forwarded. MIME, byte and decoded-format checks apply independently.
- Imports/uploads are active-admin-only, rate limited and limited to two concurrent image jobs per process. Failed imports do not mutate the published page. Existing upload/storage configuration is reused.
- The public marketing library cannot reuse medical reports, prescriptions, verification documents or account images. Private storage keys are not included in public image DTOs. Drafts, inactive slides, decorative images and orphaned assets do not enter the image sitemap.
- Published slider images are present in server-rendered HTML. Lower images are lazy loaded; responsive dimensions prevent layout shifts. `/sitemap-images.xml` is included in robots and the sitemap index. Published content/image changes update meaningful modification dates; identical saves and private drafts do not.
- Existing authentication and privacy checks remain authoritative. Robots/noindex are not access control. Existing publication, phone and patient-ID visibility settings are retained. New analytics use static action names and aggregate outcomes, without recording medical contents or patient/contact identifiers.

## Partner verification boundary

The supported prescription integration uses an active patient ID and consent. Local regression tests cover authorization, idempotency, profile receipt and email failure/retry behavior. No authorized external partner test environment was supplied, so live partner submission/email delivery has **not** been certified by this release. No name-only, phone or email recipient matching was added. Booking/contact links remain unpublished until administrators verify real destinations and coverage. No doctor listings or integrations were invented.

## Verification and evidence

- Production build passes.
- 85 database/integration tests and 33 focused unit tests pass. Anonymous/ordinary accounts are denied across all 82 exported privileged API methods.
- Additive deployment rehearsal preserves 31 populated legacy tables, applies all 24 migrations and verifies 41 models/55 database-backed GET routes, repeat deployment and schema reconnect behavior.
- UI checks cover content drafts/publication, image reuse/attachment, regional service controls, homepage editor, gallery navigation, request visibility and auth entry points.
- Route inventory and HTTP audit: `artifacts/platform-route-audit.json` and `artifacts/platform-route-http-audit.json`. The audit enumerates 101 route templates and checks 665 public URLs exposed by the isolated fixture's sitemap plus static public routes: 661 successful pages and four intended permanent redirects. No successful page is missing its canonical, single main heading, image alt attributes or bottom menu. Production coverage must be rechecked after deployment.
- Homepage comparison at 390, 768 and 1280 pixels matches the fixed-data baseline geometry/colors/fonts for the hero, heading and search, with no horizontal overflow. Screenshots and measurement JSON are in `artifacts/public-upgrade-home-*`. These are representative checks, not a claim of exhaustive animation-level pixel identity.
- Regional/mobile/editor screenshots in `artifacts/public-upgrade-city-*`, `artifacts/public-content-editor-desktop.png` and `artifacts/public-image-import-*.png` use isolated synthetic data. They do not publish test data to production.
- The final city-only browser check starts Odisha on all groups with 16 cards. O+ retains Odisha, shows only O+ cards and expands from 16 to 29 cards through Show More. Dhaka and Kathmandu use their country themes and all groups; Chennai's group-city URL retains A+. Mobile overflow checks pass. Evidence: `artifacts/public-upgrade-city-only-checks.json` and matching screenshots. These newer screenshots supersede the earlier city's homepage-style filter preview.

## Deployment and rollout

This workspace cannot access production SSH/database credentials. Code publication is separate from VPS deployment. On the existing VPS:

```bash
cd /var/www/bloodnet && bash ./deploy-prod.sh
```

The deployment script applies additive migration `20261026100000_public_content_images` before starting the new application. Retain the existing backup/storage configuration. Do not remove the additive columns/tables when rolling application code back.

After deployment, review a small set of pages and images before wider editorial publication:

1. Verify application health, actual statistics and ordinary-user/admin boundaries.
2. Open `/blood/odisha`, a group-city URL, a country page, public donor profile, blog and policy page; confirm local search, filters, pagination, privacy and bottom navigation.
3. Upload one owned image and import one permitted public image, review variants/credits and publish only after preview. Verify public CDN/local asset access and `/sitemap-images.xml`; retain old assets during review.
4. Re-run the route audit against production and inspect response/canonical/indexing results. Submit the existing sitemap index through the established search-console workflow if required. Crawling, indexing, rankings and AI recommendations remain search-engine decisions.
5. Monitor server errors, failed imports/image loading, crawl errors, search impressions and aggregate completed profile/record actions. No automatic publication, paid promotion or outreach is performed.

The existing article audit's missing/weak references remain editorial review work. This release does not fabricate citations, mark articles medically reviewed or bulk rewrite the 97 articles.
