# Blog discovery and archive update — 24 October 2026

## What changed

- The archive and public loading API support 40 articles per page. With 97 articles, pages contain 1–40, 41–80 and 81–97. Numbering continues across page navigation and loading. Next and Load More disappear at the end; Previous remains available when starting on a later page. Loading the entire archive from page 1 removes the pagination controls. Failed requests offer a retry without discarding loaded cards.
- `/blog/feed.xml` advertises all published, self-canonical articles as Atom entries with escaped titles, public summaries and original publication dates. Listing and detail metadata advertise this feed; robots.txt lists it alongside the XML sitemap. Drafts and noncanonical aliases are excluded from discovery.
- Both blog sitemaps now use the same canonical check and meaningful page-level modification baseline. The fixed baseline records the actual removal of the full homepage following articles in commit d3e0205 (23 October 2026, 19:34:02 UTC). Real subsequent article edits take precedence. Request/build time never masquerades as an article update. Database article dates and bodies are unchanged.
- The dedicated blog sitemap and feed refresh their shared caches after five minutes. Archive links in the blog sitemap use the same 40-item page size.
- Discovery-only CSS centers direct main sections, including the hero and donor grid. The homepage is outside this CSS scope; metadata and city/category filter logic are unchanged.

## Google setup and limits

After deployment, submit `sitemap-blog.xml` and `blog/feed.xml` once in Google Search Console → Sitemaps. These endpoints automatically reflect publication changes. Existing known sitemap URLs continue to work.

For authenticated sitemap submission after each healthy deployment, optionally configure:

```dotenv
GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE=/etc/bloodnet/google-search-console.json
GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:bloodnet.live
```

The file must be a service-account JSON stored outside the repository and public directories with restricted filesystem permissions. Enable the Google Search Console API and give that service account access to the matching verified Search Console property. Use a URL-prefix property (`https://bloodnet.live/`) instead if that is the property actually verified. Do not commit credentials or paste the JSON into chat.

`npm run seo:notify-blogs` authenticates using a five-minute signed JWT and submits both sitemaps through the official Search Console API. Deployment runs its optional form after health checks; missing credentials or Google failure cannot interrupt the healthy site. No authenticated production submission was performed during development because credentials were unavailable.

Ordinary blogs are ineligible for Google's restricted Indexing API. Sitemap submission requests discovery; Google controls crawl timing and indexing. Existing IndexNow support remains separate.

References: [Google sitemap formats and lastmod](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Search Console sitemap submission API](https://developers.google.com/webmaster-tools/v1/sitemaps/submit), [Google recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## Audit and editorial work

The read-only live audit in `artifacts/blog-crawl-audit-before-20261024.json` found all 97 published URLs reachable with canonical URLs, descriptions and indexing enabled. It found no duplicate canonicals. Eleven articles lack external source links; four also lack section headings. These are review flags, not proof of medical inaccuracy or an indexing block. No references, expertise claims or medical reviews were invented, and no bodies were bulk rewritten.

Review source attribution for these slugs:

- contrast-ct-scan-protocol-guide
- decoding-ultrasound-terminology-hypoechoic-mass-nodules
- echocardiographic-interpretation
- how-biliary-sludge-and-cholesterol-crystals-block-the-cystic-duct
- how-to-read-a-biopsy-report
- the-2026-national-blood-crisis-new-us-reports-on-donor-trends-and-emergency-programs (also headings)
- the-human-quotient-why-empathy-driven-design-is-the-future-of-digital-connection-in-2026 (also headings)
- the-psychology-of-choice-how-digital-landscapes-shape-human-generosity-in-2026 (also headings)
- understanding-fatty-liver-on-a-sonogram-grades
- wbc-liver-enzymes-creatinine-blood-panel-explained
- why-your-blood-type-matters-a-2026-guide-to-personal-health-and-global-impact (also headings)

## Validation

- Isolated PostgreSQL integration suite: 75 passed, including publication privacy, 40-item API pagination and canonical published-only feed checks.
- Blog discovery unit tests: 5 passed, including 97-item partitioning, XML escaping, canonical exclusions and mocked Google authentication/submission failures.
- Existing SEO content suite: 4 passed.
- Interactive component test: 40 → 80 → 97 loading, page-2 numbering, forward-button removal and failed-request retry passed.
- Production build passed. HTTP checks confirm feed, sitemap, robots and archive return 200, with feed metadata present and no homepage continuation on the archive.
- Browser verification: city hero center error 0 pixels at 1280px and 390px; no horizontal overflow at 390px. Screenshot: `artifacts/city-donor-centered-desktop.png` (synthetic local donor data).

No database migration or production data update is required. Deploy with the usual `bash ./deploy-prod.sh`, then submit the two discovery endpoints in Search Console or configure the optional authenticated notifier.
