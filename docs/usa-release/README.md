# USA edition release evidence

Reviewed 2026-11-05 using isolated PostgreSQL and synthetic accounts/listings. No production registration, publication or donor-data modification was performed.

## Delivered

- USA-only country composition with twenty default sections and a seventy-component registry.
- Fourteen curated editorial routes, each with a fixed 3-shared/9-reserved recipe; every reserved component is used across the set.
- Administrator country/area drafts, protected preview, bounded plain-text/image settings, publish/withdraw/restore, publication dates and sitemap eligibility.
- Source-labelled cards, honest aggregate counts and separate active account/manual/organization definitions; existing discovery algorithms and shared bottom navigation retained.
- Additive `UsaEditorialPage` migration with maintenance write protection; no donor backfill or automatic production publication.

## Checks completed

| Check | Result |
|---|---|
| Full medical/registration/authorization integration suite | 106 passed, 0 skipped |
| Final USA integration rerun, including new-table maintenance guard | 3 passed |
| Real additive deployment rehearsal | Passed: 31 populated legacy tables preserved, 30 migrations, schema parity and reconnect |
| Prisma/API deployment reads | 46 model reads and 64 database-backed GET routes passed |
| USA registry/schema/geography/rendering tests | 4 passed |
| Donor discovery and ordering | 14 passed |
| Regional, SEO and security unit checks | 5, 4 and 6 passed respectively |
| USA editorial UI | Curated selection, recipes, draft/preview, publish, withdraw and restore passed |
| Existing India and Pakistan support flows | Passed |
| Browser checks | Country at 320/390/768/1440; California/Las Vegas at 390/768/1440; remaining launch areas and existing USA city/group/qualified/network routes at 390 |
| Browser interactions | Category filter, appended pagination, keyboard contact dialog, login dialog, protected preview, unavailable/empty results passed |
| Administrator browser check | USA overview editor loaded at 390 and 1440 |
| HTTP checks | Permanent aliases, fifteen canonical pages, schema markup, sitemap entries, unknown-area/anonymous-preview 404 and editor API 401 passed |
| Existing route preservation | Fifteen representative routes compared: eligible content, metadata, schemas and destinations unchanged; baseline unavailable routes retained 404 |
| Guide, TypeScript and production Next.js build | Passed |

Browser artifacts include reduced-motion and dark-theme rendering. This is Chromium automation, not proof of real iPhone/Android hardware behavior. Other regional pages were captured and verified not to acquire USA presentation. Full-page pixel equality is **not claimed**: old baseline screenshot dimensions differed; HTTP content preservation and scoped-style checks provide separate evidence. The main homepage source and navigation were not redesigned.

The final production build followed the last source changes. Screenshots precede only a plain-text editorial sentence cleanup, use of the existing canonical directory-link helper and nonvisual validation/sitemap refinements.

## Screenshots

- [Country desktop](screenshots/country-desktop.webp)
- [Country mobile](screenshots/country-mobile.png)
- [California desktop](screenshots/california-desktop.webp)
- [Las Vegas desktop](screenshots/las-vegas-desktop.webp)
- [Las Vegas mobile](screenshots/las-vegas-mobile.webp)
- [Administrator editor desktop](screenshots/editor-desktop.webp)
- [Administrator editor mobile](screenshots/editor-mobile.webp)
- [Country dark-theme mobile](screenshots/country-dark-mobile.png)

Machine-readable browser, editor and preservation results are stored alongside this document. They contain route/viewport/check outcomes only; no session tokens are included.

## Owner rollout

Run `bash ./deploy-prod.sh` from `/var/www/bloodnet`. The normal deployment must apply the additive migration before the editor is used. No new environment flag is needed. The updated `/us` country design becomes available after deployment. Curated area guides remain unpublished until the administrator saves, previews, reviews and publishes them. Start with California and Las Vegas; review actual local counts, resources and service claims before expanding.

The [operating guide](../usa-edition.md) contains deployment, editing and rollback instructions. The [content inventory](../usa-content-review.md) lists all components, routes, fixed recipes and sources. A 75-km coordinate check disambiguates same-name cities for aggregates; it is not a municipal boundary. Provider and clinical coverage are not inferred from a page design.
