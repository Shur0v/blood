# Regional dashboard editor — 25 October 2026

Administrators can customize regional editions under **Admin Dashboard → Overview → Regional page content, design & images**. Select a country for its default settings or a recorded city for a city override. The main homepage remains unchanged; its existing controls remain separate.

## Editable fields

- Existing coverage-update title/description, public regional images, captions, credits, source links and dates.
- Regional theme, heading/background/accent/feature-panel colors, balanced or stacked panels, and comfortable or compact spacing. The editor includes a color preview and individual color resets.
- Introduction and donor-search headings/descriptions; related-location, FAQ, guidance and registration text; registration button text; and the text/buttons of all three homepage invitations.
- Up to eight custom FAQ questions and answers.
- Visibility of images, related locations, FAQs, guidance, registration and each homepage invitation. Hidden sections also disappear from the local section navigation.

Use `{city}`, `{country}` and `{group}` in copy fields for local text. Empty fields use the original copy. FAQ answers remain server-rendered. The filters, donor cards, counting definitions, privacy controls and fixed navigation retain their normal behavior. Homepage invitation destinations remain `/`, and registration buttons continue to open the existing registration flow. Existing metadata titles, descriptions and canonical URLs remain unchanged.

## Country defaults and city overrides

Published country settings apply to their city pages. A published city entry replaces the country entry for that city, including its design settings. **Start from published country settings** copies those fields into the city form as a starting point; it does not create an ongoing partial inheritance relationship. Unpublishing the city restores the published country/default edition. Changes apply after saving and appear on new page visits. Drafts never appear publicly.

**Open public regional page** opens an existing country-qualified city route. It shows the published version, not unsaved form changes. Resetting design fields changes the form only until saved. The donation-request switch remains a separate Overview control.

## Persistence and safeguards

Migration `20261025220000_regional_design_controls` adds a default-empty JSON design field to `RegionalPageContent`. It preserves existing content and styles. Existing clients that omit the new field retain the saved design. Saving equivalent defaults or identical content does not manufacture a new public update date; real published style/copy/visibility changes do.

Settings accept bounded plain text, known theme/layout/section values and opaque hexadecimal colors. The server enforces readable contrast; custom backgrounds remain light to preserve the existing cards and secondary text. Arbitrary CSS/HTML, invented count fields and hiding donor search/cards are not supported. Text is rendered through normal React escaping. Existing administrator authorization, request-origin checks and protected-image restrictions remain in force. The request body is bounded to 64 KiB.

Published regional reads and public network snapshots are shared within a server render, avoiding duplicate database work without adding a persistent cross-request cache. Data refreshes on the next request.

## Validation and deployment

The database/authorization/privacy suite passes 79 tests, and discovery/SEO/regional unit checks pass 27 tests. The regional UI workflow covers design selection, visibility editing, FAQ row editing, safe payloads and authentication. Real migration verification preserves 31 populated legacy tables, applies all 22 migrations, confirms schema parity and reconnect persistence, and reads all 38 Prisma models plus 50 database-backed GET routes.

Public-route checks confirm saved styles/copy, country defaults, city replacement, hidden sections, custom FAQs, draft privacy and canonical preservation. Editor screenshots are component previews with synthetic data and mocked form storage; they do not expose a production dashboard. Published-page previews use a separate isolated PostgreSQL fixture. Production data was not changed.

Browser checks cover the customized city page at 390/768/1280 pixels, sixteen initial donor cards, and no horizontal overflow. The editor was checked on desktop and mobile, including light and dark dashboard colors. Its theme/layout/copy/FAQ form saved successfully in the component preview. Homepage geometry, fonts, colors and backgrounds still match the original baseline at all three viewport sizes. Reports and screenshots use the `artifacts/regional-editor-*`, `regional-dashboard-editor-*` and `regional-customized-*` prefixes.

Deploy using the existing backup/build/migration process:

```bash
cd /var/www/bloodnet && bash ./deploy-prod.sh
```

The new database field must be migrated before the live editor is used. The deployment script handles that step. No extra role or public-profile permission is introduced.
