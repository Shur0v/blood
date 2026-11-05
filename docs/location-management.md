# Location Management and countrywide search

Account location pickers use Geoapify for signup, service locations and primary-neighbourhood editing. Search starts after two meaningful characters. Users must choose a verified suggestion before saving. Changing location text alone does not create a valid selection.

## Administrator controls

Open **Location Management** in the administrator workspace. Changes apply after **Save settings**. **Restore defaults** updates the form and also requires saving. The preview uses the saved policy. An outdated administrator form receives a conflict message and must reload before saving.

| Control | Default | Effect |
| --- | --- | --- |
| Selection detail | Cities and local areas | Includes provider-supported cities, towns, villages and neighbourhoods. Cities only restores coarse location selection. |
| Geographic scope | Countrywide | Includes matching places across districts. Current detected district only restricts new selections to the visitor's resolved district. |
| Nearby priority | On | Orders similarly relevant results by proximity. Other districts remain available in countrywide mode. |
| Spelling corrections | On | Includes verified candidates with small spelling differences. |
| Country in main label | Off | Main labels show area/city. Secondary context always retains country and available administrative names. |

Public donor search and staff donor-entry tools retain their own purposes. Saved neighbourhoods are retained when detailed selection is disabled. The existing five-parent-city maximum, service-city removal deadlines and explicit neighbourhood-update confirmations continue to apply.

## Country and district handling

A full country name in the query takes precedence, followed by a confirmed browser country or the detected visitor country, the account country and the fallback country selector. `Gabtoli` in Bangladesh searches Bangladesh. `Delhi, India` searches India. `Delhi IN` or a partial country name cannot silently switch countries. Typing a query never opens a GPS permission prompt.

District-only mode uses confirmed browser coordinates when available, otherwise server-derived visitor coordinates. Geoapify reverse lookup resolves the administrative district from that point. A city label or nearest-city fallback is insufficient to establish a district. When it cannot be established, the picker offers **Confirm my current location**. Denied permission or unavailable provider data keeps selection blocked and explains the problem. An explicit foreign country does not bypass district-only mode.

The primary-neighbourhood editor also requires an area belonging to the account's saved primary city. Travelling into a different district can therefore leave no eligible neighbourhood in that editor while district restriction is enabled. Existing records remain available.

## Retrieval, matching and result limits

Search merges country-filtered national locality autocomplete with a proximity-biased request when coordinates are available and nearby priority is enabled. Saturated or sparse results expand through Geoapify forward geocoding with a larger requested result allowance. Provider requests use timeouts, a bounded cache, concurrent-request deduplication and rate limiting. Parent verification uses at most three concurrent requests.

The service accepts populated-place fields and verifies area parents through city lookup or reverse lookup when hierarchy is missing or ambiguous. Streets, buildings and unverified parents are excluded. Query matching handles punctuation, capitalization, Unicode text and bounded spelling edits/transpositions. Ambiguous names retain separate provider identities and administrative context.

Exact and prefix matches lead corrected matches. Distance orders similarly relevant candidates. Area points are used for ranking, while the existing parent-city coordinates remain in stored service records. This preserves city-level donor matching and counts.

Every accepted candidate in the retrieved set is returned. The interface initially displays twenty, then **Show more matches** reveals additional batches without discarding the remainder. A fifty-match retrieved set can therefore be shown in full. Geoapify does not expose an exhaustive worldwide directory through these queries. If upstream limits or unresolved parents affect completeness, response metadata reports a limited set and the UI asks for city/district refinement. No empty result is replaced with an invented place.

Reviewed offline fallbacks include Badda, Merul Badda, South Badda, West Rampura, Banasree, Gulshan and Mohakhali under Dhaka. These retain city-level coordinates. Badda and Merul Badda have recorded OpenStreetMap provenance in the earlier review. Other names require valid provider records or separately reviewed additions. [Badda locality](https://www.openstreetmap.org/node/5167233263), [Merul Badda locality](https://www.openstreetmap.org/node/9028978730)

## Settings, proofs and compatibility

The additive `20261105150000_location_management` migration creates a singleton `LocationSettings` table with JSON settings and an optimistic revision. On first use, existing explicit `NEIGHBORHOODS_ENABLED` or legacy `SIGNUP_NEIGHBORHOODS_ENABLED` values initialize detail selection. With neither set, detailed selection is the default. Once saved, database settings take precedence over environment flags.

`GET/PATCH /api/admin/location-settings` requires an active administrator. PATCH accepts `{settings, revision}`. `GET /api/public/location-settings` returns effective account-picker settings. Existing UI events announce setting revisions and focused pickers refresh their settings. Keys remain server-only.

Selections carry short-lived signed proofs with policy revision and administrative identity. District-restricted proofs are also bound to the requesting visitor address. Save endpoints recheck policy and hold a shared settings-row lock while writing, so an administrator policy change cannot race a location save. Stale or altered selections must be selected again. Older proofs remain usable under compatible countrywide policies. General profile updates cannot change a city/country through arbitrary text.

Patient and service-location changes continue to synchronize their private neighbourhood metadata transactionally. Public donor responses, profiles, SEO, analytics and counts continue to use city-level records.

## Verification and deployment

Run `npm run test:locations`. Use `npm run location:check` on the configured server to print live results for the five reported Bangladesh queries without printing credentials. Its database-specific settings tests need `TEST_LOCATION_DATABASE_URL`, pointing to a fresh empty loopback PostgreSQL database named `bloodnet_location_test_<digits>`. The tests apply migrations and use synthetic records. The medical/deployment suites use their existing isolated-database variables.

Deploy through the backed-up VPS workflow with `bash ./deploy-prod.sh`. It applies the additive migration. After deployment, check the saved controls and live Geoapify results for Dhanmondi, Gabtoli, Badda, Rampura, Banasree and international places, including spelling mistakes and a confirmed-location district restriction. Live coverage requires the deployment's valid Geoapify key. This release uses Geoapify only. Google integration requires a future, separately approved change.
