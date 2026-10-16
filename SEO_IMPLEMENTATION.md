# Search discovery update — 16 October 2026

## Content and presentation

- `/guides` contains 12 original operational guides. Each guide has five detailed explanations, a practical sequence, questions, terminology, attributed sources and related navigation.
- The research design library contains 60 distinct React components in 12 families, with different guide compositions, responsive layouts, native disclosure controls and reduced-motion support. It uses the existing professional Inter typography.
- `/network` and `/network/[country]` explain actual participating country/city coverage. Country pages only exist for countries represented in the current database. Their location links stay within that country.
- Existing country/city blood and organ directories now include five explanations of their actual records. `/blood-donors/[country]/[city]/[group]` supports represented blood groups; empty groups are not indexable pages. Existing donor API connections are retained.
- The simple landing-page sequence remains intact. The desktop discovery tab opens the public pages inside the existing 70vw × 80dvh modal. Direct URLs remain accessible and server-rendered on mobile as well as desktop.

## Data and editorial provenance

Platform counts come from PostgreSQL. They describe active source listings, not verified donations, available blood units or a representative population survey. City totals can overlap because one volunteer can serve multiple cities. Country coverage sums explicitly disclose this overlap.

The live snapshot distinguishes registered, manual and community entries. Community entries are not described as an individual headcount. On a database-read failure, the guide omits totals and explains the limitation instead of displaying invented sample figures.

External figures are attributed to WHO's 12 June 2026 blood-safety fact sheet. Global figures are never presented as city-level measurements. Organ guidance distinguishes WHO's ethical framework and UK NHS Blood and Transplant context from local law and individual eligibility decisions. Clinical assessment remains with an authorised service. Content has an editorial date, without inventing a medical reviewer or survey.

## Names, phone numbers and consent

`PublicDonorProfile` is an additive table. Existing accounts receive **no public profile and no consent automatically**. Neither the migration nor profile-preference reads copy or rewrite existing user data.

An account holder can enable the additional searchable profile from their account. Publishing requires an introduction of 80–1,200 characters and confirmation that their name, blood group, city, country and introduction can be public. Full phone publication requires a separate confirmation. Phone numbers, emails and web links are rejected in the introduction so the separate phone control cannot be bypassed accidentally.

Public routes explicitly select allowed fields. They exclude email, patient ID, DOB, private medical records and exact coordinates. Admin audits can read the publication settings but cannot grant donor consent. Inactive or restricted accounts are excluded. Withdrawal removes a profile from public reads and its sitemap; public profile responses are uncached. Search engines and third-party copies can take longer to disappear.

This additional profile does not change the visibility of existing donor cards or their contact workflow. There are no pages containing lists of phone-number variations and no automatic bulk publication of registered users.

## Crawling and consolidation

- Guide, network and consented-profile sitemaps are registered in robots.txt and the sitemap index.
- Canonicals, Open Graph metadata and appropriate Article, CollectionPage, ProfilePage and breadcrumb JSON-LD identify the pages. Personal telephone fields are included only with phone-publication consent.
- Repetitive legacy `/keywords/[slug]` pages permanently redirect to an actual matching location, blood-group location, country report or relevant substantive guide. Ambiguous city names do not redirect to an arbitrary country.
- Legacy keyword sitemap endpoints redirect to the guide sitemap and are removed from the advertised sitemap index. Empty country keyword hubs consolidate into the network overview. Old short blood/organ guide URLs redirect to their detailed replacements.
- Unknown content URLs return 404; empty filtered locations are not indexable. Paginated volunteer-directory URLs are noindex/follow. API, admin, account, medical-record and embedded preview routes remain excluded from indexing.
- Static sitemap URLs no longer claim a newly changed content date on every request. Directory dates reflect record changes; guide dates reflect editorial changes.

## Deployment and verification

Use the established deployment process, including `prisma generate` and `prisma migrate deploy`. The new migration is `20261016090000_opt_in_public_donor_profiles`; apply it before serving the updated account settings or public-profile routes. Keep the current PostgreSQL URL, JWT secret and medical encryption keys. Do not run a reset, reseed production or replace the database.

Verified locally with disposable PostgreSQL databases:

- 54 integration tests: private records, admin audit, authentication, counts, geographic discovery, consented publication/withdrawal and group-filtered locations.
- A real repeatable Prisma deployment preserving all 31 populated legacy tables, all 16 migrations, schema parity, reconnect persistence, all 36 model reads and 46 database-backed GET routes.
- Content tests covering 12 substantial guides, all 60 rendered components, unique page compositions, keyword routing and public-only embeds.
- UI checks covering six user/admin profile scenarios, four registration-conflict scenarios, discovery navigation and explicit publication controls.
- TypeScript checks and an isolated production build; production HTTP checks for all 12 guides, network/profile indexes, new sitemaps, structured-data JSON, canonical tags, redirects and 404s. Desktop and 390px mobile guide layouts inspected in the browser.

These checks do not substitute for a live VPS check after deployment. The live database and Google Search Console were not accessed or modified during this work.

## After deployment

1. Verify the migration with the normal deployment checker and request the new sitemap endpoints on bloodnet.live.
2. Submit `/sitemap-index.xml` in the site's verified Google Search Console property and inspect a guide, a populated country/city/group URL and an explicitly consented donor profile. Use the existing verification environment variables if the site has not yet been verified.
3. Monitor indexing exclusions, crawl errors and actual search performance. Improve pages from observed user needs and real local participation, not invented national estimates or keyword repetitions.
4. Review source figures and editorial dates when guidance changes. Publication and withdrawal should remain donor-controlled.

The public-profile sitemap currently supports up to 50,000 consented profiles in one file. Partition it before that volume is exceeded. A site's indexing, rich-result eligibility and first-place rankings are decisions made by search engines and cannot be guaranteed by additional tags, page count or content length.

Primary guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content and https://developers.google.com/search/docs/essentials/spam-policies. Source details are also displayed beside the relevant guide content.
