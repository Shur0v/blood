# Regional discovery and SEO release — 20 October 2026

India and Pakistan are the first international priorities. This release changes discovery correctness, public facts and crawlable regional content while preserving the main landing-page design.

## Public data contracts

`getPublicBotStats`, the root page's accessible statistics, `/site-state.json`, `/site-state.txt` and the public platform-statistics API now use the same listing definitions and geographic source set as the network coverage pages.

- `registeredAccounts`, `registeredUsers` and `registeredDonors`: active registered donor accounts. The legacy registered fields previously incorrectly included manual and community entries; schema version 2 corrects their meaning.
- `manualDonorEntries`: active manually maintained blood-donor entries.
- `communityListings`: active organisation/community source listings, not individual people.
- `activeBloodDonors` and `totalListingCount`: the sum of those three source counts, once per listing. Existing homepage consumers continue using this total.
- `activeCountries` and `activeCities`: distinct countries and country/city pairs represented by the shared blood/organ location aggregation, including community listings and service cities.
- `organDonorEntries`: active pledges from active registered accounts plus manual organ entries.
- `lastUpdated`: the latest underlying location-record change, or null when unavailable. `generatedAt` is the response-generation time. Neither indicates a clinical review or current willingness to donate.

Existing fields remain present. External consumers that previously treated `registeredUsers` as a total listing count should migrate to `totalListingCount` or `activeBloodDonors`.

## Regional routes and content

`/usa` and `/united-states` permanently redirect to `/us`, preserving query parameters. The regional sitemaps include `/us` and omit its aliases. `/india` and `/pakistan` remain their existing primary routes.

Regional descriptions no longer promise verified support without checking listing status. Country pages render real directory links on the server, accessible through the floating-plus modal. Their existing footer styling now links to recorded cities and blood-group pages instead of hardcoded cities with potentially missing coverage. Empty coverage is stated honestly.

The homepage continuation previously mounted a second, unfiltered homepage below the dynamic India/Pakistan/Bangladesh/Nepal landing pages. Those routes now render their existing regional experience once, avoiding duplicate H1 headings, components and data requests. The main `/` experience is unchanged.

## Discovery and privacy

The precedence remains route country, saved manual preference, then inferred location. Only an automatically detected city can broaden to other entries within the selected country. Explicit search text, selected country, blood group and organ filters are retained; pagination uses the effective query. Network failures are not treated as empty results. The blood-donor cache version is advanced so older cached responses cannot reintroduce pre-release filter behavior during an outage.

Community listings without a recorded blood group no longer appear as exact matches for a selected blood group. They remain discoverable without that category filter.

The SQL and ORM recovery paths use equivalent nearby ordering, service-city selection and stable pagination. Recovery considers all matching candidates for distance ordering, so an older nearby entry is not lost behind a truncated newest-candidate window. Internal coordinates are stripped from both responses. Newest-first ordering remains available and unchanged in purpose.

The floating-plus modal explains empty searches and offers deliberate browsing of other cities/countries. Background floating tags cannot overwrite the active search explanation.

Analytics records aggregate result availability and contact initiation, not successful calls or donations. New discovery events contain no raw search, category values, phone numbers, patient IDs or geographic coordinates. Client labels and server ingestion normalize blood/organ filter interactions to generic interaction names. Existing phone publication and administrator approval controls remain intact.

## The 97 blogs

Reader-facing Focus/Primary keyword labels were removed; metadata keywords, article bodies, URLs, navigation, sharing images and publication state remain unchanged.

The read-only live audit checked all 97 public article URLs: all returned HTTP 200, and no duplicate canonical destinations were found. Eleven articles have no external reference links inside their article body; four of those also lack section headings. These are editorial review notes, not proof that an article is inaccurate or that a short personal story requires citations. No article was rewritten, published or deleted.

The complete per-URL report is in `artifacts/blog-public-audit-20261020.json`. Repeat the credential-free public audit with:

```bash
npm run seo:audit-public-blogs -- --base=https://bloodnet.live
```

The existing database-side `npm run seo:audit-blogs` command remains available for reviewing published database records, including missing-slug cases with authorized server access.

## Verification and rollout

The production build passed. All 64 integration tests and 32 unit/content/security tests passed, along with the modal interaction check. The automated checks cover statistics definitions, geographic coverage, SQL/recovery distance ordering beyond the first candidate window, pagination, strict filters, analytics category redaction, crawler exclusions, blog rendering, phone privacy and administrator authorization. The modal UI check covers empty states, country changes and isolation from background requests.

Before/after landing screenshots use the same synthetic database at 390, 768 and 1280 pixels. The 390px and 768px top-view screenshots have no changed pixels at the comparison tolerance; the desktop difference is 0.004%, with no heading geometry change. All 14 visible H1/H2 positions, sizes and typography match at 390, 768, 1280 and 1440 pixels. Animation/rendering differences are not treated as layout changes. Screenshots and the comparison summary are saved in `artifacts/regional-*20261020.*`.

Production HTTP checks cover regional HTML, accurate descriptions, US redirects, sitemap entries and agreement between public JSON/text statistics. The browser also confirms that an India route overrides a saved Pakistan preference and renders one H1.

No database migration is required. Deploy using the existing command from `/var/www/bloodnet`:

```bash
bash ./deploy-prod.sh
```

After deployment, compare India/Pakistan non-branded queries, landing pages and devices in Search Console over equivalent periods. Contact-initiation events measure attempts only. Real-user Core Web Vitals and CDN crawler logs still require production monitoring; this release does not claim a ranking, traffic or medical-outcome guarantee.
