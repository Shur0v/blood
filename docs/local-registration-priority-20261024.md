# Local registration priority and Home verification

Browse results prioritize the selected city and country. Within that city, registered accounts sort by registration date, newest first, before manual/community entries and nearby suggestions. When only a country is known, its newest registered accounts lead. Explicit search matching and exact blood-group/organ filters remain intact; matching nearby entries fill the remaining page where available. Distance does not move an older same-city registration ahead of a newer one. Strict API consumers retain their existing ordering.

IP detection still returns the country quickly. A shared background city lookup can enrich it using the existing provider, without requesting browser GPS permission. A city from a different country cannot be attached to the detected country, and a late IP response cannot overwrite GPS. City detection remains approximate; a country-only response uses country-level ordering. Donor recovery caches now include the city and use version 7.

Both global-menu and homepage Home handlers already call `openFreshHome`, which performs `location.assign('/')`, including repeated clicks on Home. This resets temporary page filters, requests the dynamic homepage and uses no-store donor reads, while preserving session cookies and the saved country preference. During an outage, previously saved cards remain an explicitly labelled recovery fallback.

The blood city template already embeds the exact shared landing-page Hero and donor cards. This covers `/blood/a-positive/chennai` with A+/Chennai/India and `/blood/o-negative/chandigarh` with O-/Chandigarh/India. No additional city template, title, description, canonical, structured-data or editorial content changes were made for these requests. Live page reads still showed the older static-card version, so VPS deployment remains required.

## Validation

- 71 database integration checks passed, including SQL/recovery parity, new local blood/organ registrations, exact filters, pagination, administrator authorization and phone privacy.
- 14 discovery/ordering/navigation unit checks passed, including repeated fresh-root Home navigation.
- Shared navigation, asynchronous viewer-city enrichment, donor-feed, country selector and discovery-summary UI checks passed.
- Production build passed.
- Production-mode browser with synthetic data displayed a newly registered Dhaka volunteer first in a 16-card feed, using the unchanged hero/filter/card design. Evidence: `artifacts/newest-local-donor-first-20261024.png`.

No database migration, new environment variable or dashboard change is required. All QA database writes were confined to a guarded local synthetic database; production records were not modified. Deploy using the existing `deploy-prod.sh` process.
