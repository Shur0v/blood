# SEO operations and design protection

The homepage's visible content, CSS, section order and responsive design are locked. New explanatory copy belongs inside `DonorDiscoveryPanel` or its linked guide/directory pages. Existing sections render in the first HTML response, using the same wrappers and styles. Account dashboards, authentication dialogs and the decorative fluid background remain client-only.

## After deployment

Use the existing VPS command: `bash ./deploy-prod.sh`.

1. Check HTTPS apex returns 200. HTTPS www must return 301 to the apex, preserving the path and query. HTTP redirects should terminate at the same HTTPS apex. The application handles the configured www alias; DNS, certificates and Cloudflare must still route it to this application. Do not enable an HTTPS redirect at an HTTP-only origin behind Cloudflare Flexible mode without correcting the TLS configuration first.
2. Fetch `/robots.txt`, `/sitemap-index.xml`, `/apple-touch-icon.png`, `/llms.txt` and a guide without JavaScript. Check the homepage title, canonical, language and existing informational sections in its initial HTML.
3. In Google Search Console, verify the domain property and submit `https://bloodnet.live/sitemap-index.xml`. Inspect the homepage, `/blood`, one guide and one populated city URL. In Bing Webmaster Tools, verify ownership and submit the same index. Existing `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` environment settings support HTML verification; DNS verification is managed in your DNS account.
4. Review real crawl/index errors before repeating third-party score audits. Do not change the hero text or add filler to meet an arbitrary word-count or heading-length score.

## AI search access

The explicit Googlebot, Bingbot, OAI-SearchBot, PerplexityBot and Claude-SearchBot groups allow public content and repeat private exclusions. Wildcard access remains available to other compliant crawlers. This release does not change training-bot policy independently. Robots directives are not authentication: private API authorization and no-store responses remain required.

Cloudflare/WAF challenges must be checked in the Cloudflare account using each provider's current verified crawler/IP guidance. Never bypass protection just because a request claims a bot user agent. An HTTP probe with a bot name cannot prove verified-IP access. `llms.txt` is an optional reading index, not a ranking mechanism or a required AI search feature. No special schema guarantees an AI citation.

Official references:

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.openai.com/api/docs/bots
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://www.bing.com/indexnow

## Optional IndexNow notifications

IndexNow support is opt-in. Add `INDEXNOW_KEY` (8–128 ASCII letters, digits or hyphens) to the server's private production environment file and deploy. This is a public site-verification value, not an account password. `/indexnow-key.txt` returns 404 until configured. Back up the existing environment file and preserve all encryption keys.

After publishing, updating or withdrawing public content, submit only its changed canonical URLs, for example:

```bash
npm run seo:submit -- / /blood /guides/find-blood-donors-near-you
```

The command verifies the deployed key before notifying IndexNow. It rejects foreign hosts, account/API paths and query strings, deduplicates URLs, has network timeouts and reports acceptance only for HTTP 200/202. An accepted notification does not guarantee crawling, indexing or ranking. Do not automatically submit every unchanged sitemap URL on each request. No network submission occurs during tests/builds.

## Validation and measurement

Run `npx tsx --test tests/seo-foundations.test.ts tests/seo-content.test.ts tests/donor-discovery.test.ts tests/security.test.ts`, TypeScript checking and the production build. Against an isolated local production server, run `SEO_TEST_BASE_URL=http://127.0.0.1:PORT node tests/seo-http-check.mjs` (set the variable using the current shell's syntax). Use the production canonical base URL for that build.

For visual comparison, use the same isolated database, theme, viewport and ad settings. Compare settled sections after loading content on both versions. Rotating slides, donor animations, counter animation and data updates should not be mistaken for CSS changes. Check desktop, tablet and mobile. Do not claim a universal pixel match from one viewport.

Measure Core Web Vitals using field data when available: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile. Local development timing is not a production performance score. Keep private responses out of shared caches; do not cache the global theme/ad controls in a way that delays administrator changes. Simple Analytics remains installed once; do not add medical details, contact numbers or private identifiers to analytics events.

Backlinks, legitimate partner mentions, social-account ownership, Search Console/Bing access and field/AI-citation reporting require work in external accounts. No accounts, affiliations, reviews, endorsements or backlinks should be invented to satisfy a score. Only add maintained translations with reciprocal language URLs; cookie-based preferences are not alternate-language pages.
