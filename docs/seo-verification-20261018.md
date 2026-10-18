# SEO verification — 18 October 2026

## Completed repository work

- Existing homepage sections render in the initial HTML. New guide search, explanatory copy and coordination help live inside the floating plus modal and linked pages.
- Canonical metadata, private-page indexing rules, explicit search-crawler groups, sitemap cleanup, an Apple touch icon and the optional reading index are implemented.
- Structured data describes the relevant content: the network dataset belongs on the network page, and the homepage no longer advertises a fabricated search endpoint or invisible regional FAQ answers.
- The public-profile guide describes administrator-controlled publication and correction/removal requests.
- Optional IndexNow verification and submission tooling is available, with private/foreign URL rejection and no automatic network submission during builds or tests.

## Checks performed

| Check | Result |
| --- | --- |
| SEO, guide content, donor discovery and security tests | 22 passed |
| Medical/profile regression suite for the SEO implementation | 59 passed; the final redirect correction changes no medical/authentication code |
| Final production build | Passed |
| Production HTTP checks on a fresh disposable database | Passed; migrations applied successfully |
| Initial HTML | Existing homepage content, footer links and modal guide links present without executing scripts |
| Metadata and JSON-LD | Language/canonical present; Organization, Article and BreadcrumbList checked; dataset verified on network page |
| Public/private boundaries | Public pages indexable; embedded previews noindex; unauthenticated profile API returns 401 and noindex |
| Sitemap checks | Reviewed maps omit removed aliases and redirect-only guide URLs; no duplicate URLs within those maps |
| Production modal | Search for “privacy” returns three guides; a guide opens inside the iframe; Back works; Escape closes and focus returns to the plus trigger |
| Hydration | No error messages recorded in the final production browser session |

The earlier controlled comparison used the same isolated database and settled content at desktop (1440px), tablet (768px) and mobile (390px). All 17 homepage section heights and vertical positions matched, with zero measured deltas. This verifies the tested geometry; it is not a claim that every animated frame or all possible devices are pixel-identical. No landing-page stylesheet, visible copy or section ordering was changed.

## Redirect correction caught during final live verification

The deployed www alias returned `https://bloodnet.live:3000/`. Assigning `URL.host` without a port retained the internal Next.js port. The correction explicitly sets the canonical hostname and clears the port. A regression case covers a request URL at `localhost:3000` behind a `www.bloodnet.live` Host header. Raw HTTP testing against the production build confirms a 301 to the HTTPS apex with the original path and query and no internal port. The test uses raw HTTP because Node fetch can replace the supplied Host header.

The live apex returned 200, the Apple touch icon returned 200, and the live initial HTML contained the guide search, About and FAQ content. The corrected redirect still requires deployment of the follow-up commit using the existing `bash ./deploy-prod.sh` command.

## External work still requiring account access

Search Console/Bing ownership verification and sitemap submission, Cloudflare verified-crawler/WAF review, optional production IndexNow-key configuration, genuine partner links and field performance/citation monitoring are not represented as completed. Follow [SEO operations](seo-operations.md). No ranking, audit-score or AI-citation guarantee is made, and no live medical data or production credentials were used in local verification.

Modal evidence: [production screenshot](../artifacts/seo-production-modal-20261018.png).
