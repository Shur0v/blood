# Donor-card diagnosis and location-page repair

## Confirmed live cause

The affected visitor reported **Anguilla** selected in the floating-plus country selector. The homepage intentionally constrains searches to the effective country; it does not replace that country when no matching entries exist. This explains a global donor total alongside an empty regional list. The evidence does not establish whether Anguilla came from a previous manual selection or automatic detection.

Read-only live checks returned successful donor responses for Bangladesh, India and India/O+/Odisha. A fresh browser session displayed Bangladesh cards. No donor deletion or dashboard publication change was needed. The immediate user step is to select Bangladesh in the floating-plus selector and confirm the results.

## Code changes

- Empty results identify the selected country, text search and blood group, with a button to open location browsing.
- Failed requests are distinguished from real empty results, with an explicit retry. Returning online retries the search. Requests have a 15-second timeout and preserve navigation/filter cancellation.
- A successful statistics response no longer prevents restoring cached donor cards. Caches remain isolated by country, group, query and the location page's nearby ordering. Errors do not remove country or donation filters.
- `/blood/[slug]/[city]`, including `/blood/o-positive/odisha`, uses the existing homepage Hero, blood filters, donor-card markup, contact modal and pagination. India is forced from the recorded location; Odisha and O+ are initial filter values. Different saved/inferred countries cannot override the route. Other cities in the visitor's location cannot outrank the page's named area using remote visitor coordinates.
- Existing blood location directory pages use the same component. Organ directory behavior is retained.
- The location page keeps its server-rendered title, explanatory text, recorded donor names, links, canonical URL and metadata. The shared Hero uses H2 so the page keeps one H1. No extra homepage is appended.
- The group count comes from the full city summary rather than the SEO preview's capped 48 rows.

The healthy homepage's styling, filter/card design and animations are unchanged. No schema migration, new environment variable, package dependency or dashboard reconfiguration is required.

## Verification

The donor-feed UI regression passed: Anguilla's empty state, switching to Bangladesh, a Mumbai visitor opening India/O+/Odisha, active filter selection, cached-card recovery when statistics succeed, honest uncached failures and retry. All 12 discovery tests, the navigation UI regression and the production build passed.

Production-mode browser checks confirmed local Odisha entries before broader text matches, functioning A+ selection, one H1 and one bottom menu. The Anguilla empty-state action opened the selector; switching to Bangladesh restored cards and pagination. These checks use synthetic fixtures only; no live donor records were modified. The screenshot is `artifacts/odisha-shared-donor-ui-20261023.png`.
