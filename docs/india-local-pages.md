# India local pages — editing, geography and deployment

Reviewed 6 November 2026. This guide describes the repository implementation, not confirmation of a production deployment.

## What changes

India state/city guides and existing eligible local directories use a scoped ivory, saffron, deep-green and indigo presentation. The library contains sixty components: introduction, working search, results and fifty-seven distinct guidance structures. A default area composition has twelve sections. Optional sections can be hidden; no filler is inserted to preserve a count.

The current `/india` country landing page is rendered through its existing implementation and metadata. The root homepage, other regional editions and bottom navigation are not redesigned. India keeps eighteen-card batches, existing local/new-registration ordering, broader suggestions, category filters, contact privacy and pagination. The component library changes presentation and explanations, not matching algorithms.

Twenty city guides and six state guides are prepared. **They are not automatically published in production.** Existing eligible city-only, blood-group/city and country-qualified blood/organ directories receive the local presentation while retaining their routes and coverage requirements. The India network keeps its overview purpose with a scoped visual treatment. Organ-category pages retain their selected organ and clinical-coordination limits; administrator-reviewed request workflows remain separate.

## Administrator workflow

1. Open Dashboard Overview → **India Local Pages · layouts, copy & publication** (`#editor-india-local`). Active administrator authorization is required. Managers and ordinary users cannot use its API or private previews.
2. Choose **India local defaults**, a curated state/city, or a recorded legacy location. Local defaults do not edit the `/india` country landing page. Its existing editor remains separate.
3. Review the geographic context and source. Add local context before publishing a curated guide; the server requires at least 100 characters. A length check does not substitute for editorial review.
4. Review the introduction, nine reserved-section choices, optional visibility and approved treatments. Core introduction/search/results stay available. Area recipes are fixed across reloads. Published local-default recipes affect new unreviewed locations; they do not replace the explicitly reviewed area recipes.
5. Edit relevant FAQs, select approved external resources and place up to two images through the existing public managed-image workflow. Private verification documents and medical records cannot be selected. Regional gallery hiding remains authoritative.
6. **Save draft**, then open **saved private preview**. Unsaved form edits are not in the preview. Preview access requires an active administrator and is excluded from indexing, sitemaps and analytics. The default preview demonstrates Chennai; publishing local defaults does not publish Chennai.
7. Check desktop/mobile, copy, source definitions, working destinations and actual coverage. Select **Publish reviewed page** only when the page is ready. Start with Chennai, Kerala and Banda before expanding.
8. **Withdraw** or **Restore defaults** removes the published override. Curated editorial routes return 404 and leave sitemaps; existing coverage-gated directory routes keep their original eligibility and fall back to inherited local presentation. Restore also clears the saved draft. It does not delete donor records or managed images.

Precedence is published area configuration → applicable existing published regional settings → India local defaults → built-in local copy. Per-section values merge individually. Existing regional optional-section hiding is inherited unless the area explicitly changes that section's visibility. The gallery switch remains authoritative for managed imagery. Existing regional settings may intentionally affect both the India country landing page and its cities; use this separate local editor when the country landing must remain unchanged.

No-op publication preserves the previous public modification date. Draft saves do not replace live content or emit a public-change notification. Meaningful publish/withdraw/restore changes notify administrators without patient data. These notifications link to the owning editor; they do not identify donor rows or perform business actions.

## Geography and counts

Curated state guides aggregate only their reviewed city mappings. A record whose city is merely `Odisha` is not assigned to Bhubaneswar or Cuttack. The existing Odisha-labelled directories still search that recorded label. They do not become a city directory or claim complete statewide coverage.

Aliases such as Bengaluru/Bangalore, Mysuru/Mysore and Thiruvananthapuram/Trivandrum share a reviewed area identity without renaming stored records. Curated searches prefer an actual recorded alias when one exists. The working search still searches one stored city label at a time; it does not silently merge aliases or change donor ranking. Existing regional overrides on the selected recorded alias remain applicable.

Curated city aggregates require a reviewed label and a coordinate check within 30 km of the reference point. **This disambiguates names; it is not a municipal-boundary polygon, district allocation or neighbourhood test.** Missing/unconfirmed coordinates are excluded from curated local totals. Unresolved matching location rows are described separately and are not a count of additional people. Legacy directories retain their recorded-label scope rather than receiving automatic geographic corrections.

Registered-account totals count active participating accounts and de-duplicate a person serving several mapped cities. Manual individual entries and organization contacts have separate figures. Blood-directory counts are not available blood units, clinical capacity, screened donors or completed donations. Organ pages identify their pledge results separately from the blood-directory coverage summary. Worldwide accounts remain a separate definition; local totals must not be advertised as worldwide registrations.

The live inventory captured 443 country-qualified India directory URLs. Some stored labels are broad, ambiguous or potentially inconsistent with the country. Their inclusion in the inventory is not geographic verification. This release preserves them and their existing data; data correction needs a separate reviewed operation.

## Content, services and privacy

Use clear, practical language: the collecting city, requested component, hospital instructions, one coordinator and respectful contact. Directory entries are starting points. Donation eligibility, screening and clinical arrangements remain with the collecting service. BloodNet does not allocate organs, provide blood stock or certify medical eligibility.

Health-resource links use official e-RaktKosh and NOTTO sources. They do not imply affiliation or partnership. Eligibility thresholds and treatment recommendations are not copied into these pages. Medical-profile examples are labelled fictional. Provider delivery and doctor actions keep their existing availability checks; planned features have no invented working booking button.

Interactive worksheets, checklists and demonstrations remain in browser memory and do not submit requests, upload records, change availability or add service cities. They are labelled demonstrations and ask for fictional details. Their values are not analytics payloads. Real registrations and account operations continue through the existing authenticated interfaces.

Only bounded plain text, known component identifiers, approved variants/resources and validated public managed-image references are accepted. No raw HTML, arbitrary component execution or custom action URL is permitted. Donor coordinates, neighbourhood fields, private contact information and medical contents do not enter the new public content interface.

## Deployment and rollback

The additive migration `20261106150000_india_local_pages` creates `IndiaEditorialPage` and the maintenance write guard. It performs no donor backfill, location rewrite or mass publication. Use the existing normal deployment:

```bash
cd /var/www/bloodnet
bash ./deploy-prod.sh
```

No new paid service, provider key or environment switch is needed. Confirm the migration succeeded before opening the editor. New `/india/states/...` and `/india/cities/...` guides intentionally return 404 until explicitly published. Never run preview fixtures against production.

For content rollback, withdraw an area or restore its defaults. Existing directories fall back; newly curated editorial guides become unavailable. Retain the additive table and original managed assets when rolling application code back. Do not drop tables or modify donor records as a rollback shortcut. Review a database backup and normal deployment rollback procedures before any wider production change.

After deployment, inspect published canonical pages in Search Console, verify sitemap entries and current stylesheet delivery, and monitor crawl errors, impressions, registrations and contact initiation. Unique layouts and descriptive tags do not guarantee indexing, search position, AI recommendations or medical outcomes.

See [component, source and recipe inventory](india-local-release/content-and-recipes.md), [release evidence](india-local-release/README.md), and the administrator Platform Guide/Switch Directory.
