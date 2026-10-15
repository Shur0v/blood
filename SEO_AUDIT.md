# Donor discovery and SEO update — 15 October 2026

## Corrected issues

- The existing `/blood-donors/[country]/[city]` and `/organ-donors/[country]/[city]` routes ignored the city and inherited the homepage canonical. Organ-city routes also opened the blood homepage. They now resolve actual active locations, render the appropriate directory, and have unique titles, descriptions, canonical URLs, social metadata, CollectionPage data, and breadcrumbs. Unknown or empty locations return 404 instead of a generic homepage.
- New public location queries include primary locations and all service cities, deduplicate donors within each location, exclude inactive registered donors, and support both blood and organ entries. Counts, categories, and recent public donor previews render in server HTML. Public previews select only names, donation categories, and registration dates—not emails, patient IDs, health details, or private medical records.
- The homepage and city/country directories now contain crawlable links to these real donor locations. Country links no longer point back to the same generic directory when a country has no predefined shortcut. Client donor cards also include country and city in their existing API requests.
- The location sitemap includes only supported active blood/organ locations, uses database change timestamps, and has a bounded five-minute cache rather than a day-long stale window. Database outages return 503 for this sitemap rather than a successful empty replacement. The main sitemap now reads current locations dynamically.
- Bone Marrow is recognized by the older organ SEO queries as well as the newer directory. Available organ types are no longer inferred from only the first 48 donor rows.
- Corrected root social metadata, added a 1200×630 social image, optional Google/Bing verification tokens, removed inaccurate country-as-language alternates, and identified BloodNet as an Organization rather than implying a licensed MedicalOrganization. Private/account/admin/API/preview responses have noindex headers. Existing routes and database relationships remain intact; no migration is required for this update.

## Donor order and session fixes included

The default public blood feed places registered donors first, newest registration first, with a stable ID tie-breaker. Location and country alphabetic order cannot bury a new signup. Profile edits do not move older accounts ahead of newer registrations. City-specific grids can explicitly request nearby-first ordering. The SQL and ORM fallback paths follow the registration rule. Responses are uncached; cancelled filter requests cannot overwrite a newer selection, and fallback caches are scoped to the current filter.

Medical writes accept the configured public origin when the VPS terminates HTTPS and forwards internally over HTTP. Foreign origins remain rejected. Medical UI permission errors no longer clear a valid session; unauthenticated 401 responses still trigger the session-expired flow. The tablet Available label is larger with matching button width and thumb positioning.

Ad placements share one settings subscription. A fresh page performs an initial settings lookup; when the master switch is off, it schedules no repeated ad-settings requests and does not load AdSense from the root HTML. Enabled ads share a 30-second refresh. An admin change propagates to public tabs in the same browser through a storage event. Visitors whose tabs already cached OFF on another browser see a remote ON change after reload; avoiding OFF polling necessarily makes that tradeoff. Existing APIs remain unchanged.

## Verification

- All 34 PostgreSQL integration tests passed, covering proxy cookie history/upload, rejection/recovery, all eight blood filters and All groups, pagination, SQL fallback order, active primary/service-city counts, country-specific canonical metadata, privacy, and Bone Marrow discovery.
- All four ad store tests and two environment tests passed. Ad coverage includes concurrent placements, OFF/remount behaviour, enabled refreshes, late responses, network errors, visibility, and admin updates.
- HTTP checks verify actual Next responses for cookie sessions through the proxy, no-store donor headers, server-rendered city titles/canonicals/public previews/JSON-LD, unknown-location 404s, active-only sitemap entries, and PNG social-image generation.
- TypeScript and the isolated Next production build passed. Browser visual verification was unavailable because the existing tab was on an internal connection-error page that browser automation could not inspect; no claim of completed browser visual review is made.
- Only disposable loopback PostgreSQL databases and synthetic accounts were used. No live user data was changed.

## After VPS deployment

Keep the existing database and secrets. Rebuild/restart using the normal checked deployment flow. Check that the public base URL is the canonical HTTPS domain, then inspect `/cities`, a real blood-city page, `/sitemap-location.xml`, and `/opengraph-image` on the live host.

Optionally set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` to the HTML-tag content tokens from the corresponding webmaster tools and rebuild. For Google's HTML-tag method, use a URL-prefix property; domain-property verification uses DNS instead. Submit `https://bloodnet.live/sitemap-index.xml` in Search Console and inspect representative real location pages with URL Inspection. Review indexing exclusions, crawl errors, search queries, and country/city impressions after recrawling. Search Console access was not available here, so the cause of any ranking decline cannot be established from the screenshot alone.

No new mass keyword pages or fabricated availability/review claims were added. Existing keyword routes were preserved; their indexing/content quality should be reviewed against actual Search Console evidence before bulk removal or consolidation. Ranking position and indexing time cannot be guaranteed by code or meta tags.

Guidance: [Google's JavaScript SEO documentation](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), and [spam policies covering keyword stuffing and doorway pages](https://developers.google.com/search/docs/essentials/spam-policies).
