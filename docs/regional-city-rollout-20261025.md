# Regional city rollout — 25 October 2026

This release supersedes the Nepal-only city rollout in `nepal-regional-edition-20261025.md`. Every existing blood-donor city page now uses the shared twelve-section experience, including `/blood/{city}`, `/city/{city}`, `/blood/{blood-group}/{city}` and both country-qualified `/blood-donors/{country}/{city}` forms. Routes still require actual directory coverage; nonexistent cities and blood-group combinations remain unavailable.

The homepage `/` remains unchanged. The original city introduction, statistics, filter hero and donor cards retain their presentation, with Login/Register actions. General city pages now include the same working hero and cards. The lower sections add country themes, coverage explanations, local navigation, FAQs, real related locations/groups, published reading and registration. India uses warm clay/cream with forest panels, Pakistan uses soft green, Bangladesh uses green with crimson, Nepal retains ivory/indigo, and other countries receive the neutral international edition. These colors are scoped to regional content. The bottom navigation and floating-plus discovery remain available.

The request preparation section remains hidden by default under the existing Overview switch. There are eleven visible logical sections while it is disabled and twelve when enabled. Three optional homepage invitations link to `/`; visitors can complete their city search directly. No simulated donor cards, fabricated local news or automatic publication is introduced.

## Country content and SEO

The existing administrator regional editor can now publish updates for any country represented in the directory. Country content is inherited by its cities; published city overrides take precedence. Image validation, credits, draft controls, public-media boundaries and administrator authorization are unchanged. Other country landing pages retain their previous presentation; `/nepal` retains its existing country design.

All country labels, coverage links, breadcrumb destinations and related city links are derived from the current country. Unknown country landing routes fall back to their actual `/network/{country}` page. Short legacy routes keep their existing country-resolution rules, while country-qualified links remain explicit. City statistics are restricted to that country rather than combining identically named locations.

Existing URLs, canonical destinations and metadata titles/descriptions remain intact. Genuine city-template/publication changes contribute modification dates for every country. Organ-city sitemap dates retain their actual data dates. No unrelated country landing date is advanced, no article is rewritten, and no empty keyword routes are created. City dates use UTC consistently in the introduction and coverage details.

No additional database migration or new role is required. Deploy with the normal `deploy-prod.sh` script so existing pending migrations, if any, are applied through the established backup/build/migration checks.

## Verification

- 78 database, authorization and privacy tests passed, including publication outside Nepal and country-content isolation.
- 26 discovery, SEO and regional unit tests passed; the regional UI workflow passed publication controls, authentication, gallery, request visibility and copying.
- Production build passed.
- 152 HTTP city-route checks across India, Pakistan, Bangladesh, Nepal and Kenya passed for all eight represented blood groups. Checks cover canonical destinations, country context, selected filters, logical sections, structured data, sitemap inclusion, unauthorized editor access and missing-city responses.
- Six city pages passed 390/768/1280-pixel browser checks without horizontal overflow. Each retained sixteen initial cards and its route city/group; Chennai Show More reached thirty-two cards. Section links, FAQs and Home navigation worked.
- Homepage hero geometry, fonts, colors and backgrounds matched the original fixed-data baseline at all three sizes. Animated screenshots are not claimed to be pixel-identical.

Screenshots and reports are under `artifacts/all-city-*`. Their donor data is synthetic and was used only in an isolated local PostgreSQL preview. Production data was not edited. The live Nepal screenshots capture the previous production state before this wider rollout. Push alone does not deploy the VPS; live verification follows server deployment.
