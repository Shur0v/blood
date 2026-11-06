# Pakistan Local Pages — administrator operating guide

Reviewed 6 November 2026. This document describes the repository implementation; it does not establish that production has been deployed.

## What changes

Pakistan local directories use an independent forest-green, mint and warm-white component library. Its sixty registrations include the existing working search and results, plus fifty-seven distinct guidance structures. Default city and regional recipes contain twelve sections; optional visibility can reduce the count without inserting filler.

The existing `/pakistan` fifteen-section country composition, `/pk` permanent redirect, root homepage, other country editions and bottom menu remain independent. Pakistan keeps sixteen-card batches, category filters, existing local/new-registration ordering, broader suggestions, contact dialogs, account privacy and service-city behavior. Source labels distinguish active registered accounts, manually maintained individuals and organizations.

## Editor workflow

1. Open Dashboard Overview → **Pakistan Local Pages · layouts, copy & publication** (`#editor-pakistan-local`). Active administrator access is required; managers and users cannot edit or preview drafts.
2. Choose local defaults, one of the seven province/territory guides, one of the twenty-four city guides or a recorded legacy location. Local defaults do not change the `/pakistan` country landing page.
3. Review the geographic brief and source. A curated guide requires at least 100 characters of reviewed local context before publication. This is a validation minimum, not a recommended SEO word count.
4. Maintain bounded plain-text headings and supporting copy. `{place}`, `{city}`, `{country}` and `{group}` use the established template formatting. A reviewed Urdu place label is optional per area; it does not make an English guide an Urdu translation.
5. Keep nine different reserved sections. Search and results stay first and cannot be hidden. Use only approved treatments and relevant FAQs/resources. Authority directories are jurisdiction-specific.
6. Add up to two managed public images through the existing media picker. The regional gallery visibility switch remains authoritative. Private medical or verification files are rejected.
7. **Save draft**, then open **saved private preview**. Unsaved form changes do not appear in preview. The defaults preview uses Lahore; publishing defaults does not publish Lahore.
8. Review mobile/desktop copy, actual coverage, resource destinations and functioning actions. Publish Karachi, Lahore and Punjab pilots first, then review the remaining guides individually.
9. **Withdraw** removes an area override. Curated guides become unavailable and leave sitemaps; established coverage-gated directories remain subject to their original eligibility and use inherited presentation. **Restore defaults** also clears the saved draft. Neither action deletes donors or media assets.

New `/pakistan/cities/...` and `/pakistan/regions/...` guides are **not automatically published**. They return 404 until an administrator explicitly publishes them. Private preview requires current administrator authorization and is excluded from indexing, sitemaps and analytics.

## Inheritance, controls and notifications

Precedence: published area configuration → applicable published regional configuration → Pakistan local defaults → built-in local content. Section settings merge individually. Reviewed area recipes are not replaced by a single global-default recipe unless the area itself explicitly supplies a recipe.

Existing regional optional-section controls remain inherited unless an area deliberately overrides the mapped section. Gallery hiding remains authoritative. The existing donation-request visibility switch still governs the real request-preparation feature; local demonstrations do not bypass it.

Palette overrides from the existing regional editor apply to the light local surface. Dark presentation uses readable dark defaults. The unchanged country editor can intentionally affect country and city content; use Pakistan Local Pages for changes that must remain local.

Draft saves do not change live content or the public modification date. No-op publication retains the previous date. Meaningful publication, withdrawal and restore changes create safe administrator notifications linking to the owning editor. Reading a notification does not publish content or approve donor information.

## Geography and source counts

The launch registry contains Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad Capital Territory, Azad Jammu and Kashmir, and Gilgit-Baltistan. Regions are not treated as cities. The AJK guide explicitly describes its Pakistan-administered scope and does not claim all-Kashmir coverage.

The twenty-four city references were checked against the GeoNames Pakistan data. A thirty-kilometre reference check plus reviewed aliases disambiguates curated city counts; it is not a municipal-boundary test or a change to donor matching. Existing coordinates and labels remain untouched.

Regional totals include reviewed city mappings and de-duplicate accounts serving several cities. Broad Punjab and ambiguous Kashmir labels are not automatically assigned to a city. Unresolved matching location rows are not additional unique people. Legacy directories retain their labels and established search behavior.

A region guide searches one selected city at a time. Its aggregate coverage is separate from the displayed city results and broader suggestions. Organizations are contacts, not individual donors, accreditation, blood inventory or confirmed service availability. Worldwide registered-account totals remain worldwide.

## Content and privacy

Keep useful local context, one collecting city, clear source definitions and practical coordination steps. Do not invent hospital coverage, shortages, travel times, verification, endorsements or medical outcomes. The reviewed resource directory links to official sources without copying hospital lists into donor records.

English remains the primary language. Visible Urdu place labels help recognition; no hidden Urdu keyword lists or false Urdu language alternates are generated. Full Urdu translation is a separate release. Search positions, indexing and AI recommendations remain outside the platform’s control.

Worksheets, checklists, participation examples and fictional medical timelines remain in browser memory. They submit nothing, persist no medical data and change no account settings. Use fictional details only. Supported private-record and provider descriptions keep their actual availability and patient-ID integration boundaries.

## Deployment and rollback

The additive `20261106190000_pakistan_local_pages` migration creates `PakistanEditorialPage` and its maintenance write guard. It performs no donor backfill, reassignment or automatic publication.

```bash
cd /var/www/bloodnet
bash ./deploy-prod.sh
```

No new environment switch, external API or paid service is required. Verify migration and application health before using the editor. Recheck real-device rendering, registration/login, local filters, sixteen-card pagination, contact privacy, country isolation and the bottom menu after deployment. Never run preview fixtures against production.

For content rollback, Withdraw or Restore the relevant override. Retain the additive table and managed assets when rolling application code back. Do not remove donor records or drop database tables as a rollback shortcut.

Review Search Console/Bing crawl errors, page/query/language impressions and aggregate completed registrations/contact actions. Publication and layout variation do not guarantee ranking.

See the [component, source and recipe inventory](pakistan-local-release/content-and-recipes.md) and [release evidence](pakistan-local-release/README.md).
