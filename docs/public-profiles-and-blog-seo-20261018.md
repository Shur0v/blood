# Public donor profiles and blog SEO — 18 October 2026

## Administrator publication controls

The All User List has a globe beside the existing profile-view and delete actions.

- Single-click the globe to publish or withdraw a public donor profile. This shortcut always saves phone visibility as private, including when the profile previously displayed a phone number.
- Double-click to open the existing public URL in a new tab without changing publication. Ctrl/Cmd+Enter is the keyboard alternative. The single-click action waits briefly so a double-click can cancel it.
- A green globe means the profile is currently public: the donor is active, the profile has administrator approval, and the account is not restricted.
- Open the existing profile-view panel and expand **Public donor profile** at the bottom for the full article editor, ten introduction templates, explicit approval and **Include phone number** option. These controls remain available.

The shortcut uses the same administrator authorization, origin checks, rate limiting and publication service as the full editor. Existing public URLs remain stable. It never publishes account emails, patient IDs, medical records or precise coordinates.

## Public donor pages

Published profiles now contain recorded public facts, an update date, section navigation, sharing, six practical coordination sections, recorded service cities when present, relevant guides and profile questions. The existing introduction, local browsing, editorial attribution and optional phone-contact panel remain.

The added text explains how to coordinate a hospital request; it does not invent personal donation history, medical eligibility, availability, qualifications or testimonials. A profile without phone permission omits the phone from its public data, HTML and structured data.

## Existing blog coverage

The shared templates apply automatically to existing published articles; no bulk rewrite or URL migration is required.

- Server-rendered archive pagination lets crawlers follow links beyond the first twenty articles. Load More continues to work.
- The blog sitemap includes published article URLs and archive pages, with actual modification dates.
- Article metadata respects existing custom titles, descriptions and valid canonical settings, with readable fallbacks.
- BlogPosting and breadcrumb structured data use the actual article title, author type, dates, language and rendered word count.
- Each article has a generated social-sharing image, reading time and navigation for existing section headings. Body H1 headings render as H2 beneath the page title. Sanitization remains in place; stored article bodies are unchanged.
- Related reading is stable and ranked by topic overlap rather than randomly shuffled.
- The public listing API returns excerpts rather than full article bodies or internal author IDs. Anonymous author location and avatar stay private.

Run `npm run seo:audit-blogs` on the deployed server to produce a read-only JSON report of missing slugs, automatic descriptions, missing headings, missing external references and duplicate canonical destinations. This is an editorial review queue, not proof that every article's medical claims have been independently reviewed. This change was verified with synthetic data; it has not audited the production database.

Google documents [crawlable pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) and [article structured data](https://developers.google.com/search/docs/appearance/structured-data/article). Correct implementation improves discoverability and interpretation; rankings, rich results and citations by AI search services are not guaranteed.

## Validation

- Production Next.js build passed with isolated local configuration.
- 61 medical, authentication, privacy and public-profile integration tests passed.
- 18 SEO, content and security tests passed.
- Globe UI checks passed: single-click publish/hide, double-click opens without mutation, green status and pending-click cleanup.
- Browser checks confirmed single-click state changes, the green globe, preserved full phone controls, and the expanded public profile at desktop and 390px mobile widths without horizontal overflow. The embedded browser does not expose the new window requested by `window.open`; that call and mutation cancellation were verified in the UI interaction test.
- Production HTTP checks used 425 synthetic published posts: every article appeared in the sitemap, page 22 was reachable, page 2 contained the correct next articles, and article anchors, schema and PNG sharing images worked.
- The public-profile HTML contained neither the synthetic private phone number nor the email address.

The landing-page layout, styling and responsive behavior were not edited. Deployment remains `bash ./deploy-prod.sh` from `/var/www/bloodnet`.
