# Database-backed country choices and local-first donor browsing

This release supersedes the strict-country browsing behavior described in the 20/23 October discovery notes, following the request to fill partial local lists with nearby donors. Existing API callers remain strict unless they explicitly request expansion.

## Country choices

`GET /api/public/donor-countries` returns only country names represented by active individual donor accounts, their service cities, active maintained blood-donor entries or maintained organ-donor entries. Organisation-only listings and inactive individuals do not create dropdown options. Maintained donor entries are included so imported individual donors remain discoverable; they are not relabelled as registered accounts.

The endpoint reads current database records and uses no-store responses. Browser consumers share a request and refresh on focus/visibility changes and every minute while visible. New-country registrations therefore need no deployment or dashboard setting to enter the list. A failed refresh retains previous known options. Unavailable saved preferences are cleared; automatic detection remains the fallback. Countries without coverage are never invented as options.

## Feed behavior

Blood and organ browse surfaces opt into `expand=nearby`, retaining the selected country as **priority**, not a hard exclusion. The sequence is:

1. Matching donors in the selected/detected city and country.
2. Matching donors in the remaining cities of that country.
3. Matching donors elsewhere, ordered by distance when coordinates are available, with stable location/recency ties.

The origin is the visitor's permitted/detected coordinates when appropriate. Otherwise the server computes an approximate city/country reference from recorded individual-donor locations. That reference stays server-side, including when a country has only one donor. Coordinates never appear in the country response or donor-card response. Where reference/candidate coordinates are missing, recorded country relationships and stable ordering provide a fallback; that order is not a measured distance.

The database paginates one ordered matching result set, up to 16 cards per page. This avoids separate local/global cursors, repeated local cards and truncated city lists. Client append operations also deduplicate listings. Normal SQL and blood-query ORM recovery use equivalent priority/distance ordering, including the user's main city and service cities.

Blood-group, organ and explicit text filters remain constraints. A prefilled location-page city (such as Odisha) is a locality preference, allowing other cities/countries to fill the page after local matches. The route's country outranks a saved preference. Newly requested categories still remain exact; unknown-group community entries cannot fill an O+ result set.

“Show More” continues while real matching records remain. If fewer than 16 matching records exist globally, the list ends honestly; this implementation never invents or repeats cards to fill space. Organ requests remain on their existing separate rules. Strict donor API requests without `expand=nearby` retain country/search constraints for compatibility.

## Presentation and release

The existing landing page styling, grid, filters, menu and animations are retained. Explanations of broader suggestions and coverage refresh errors appear in the floating-plus modal. The donor-card cache advances to version 5 to avoid reusing old strict-country pages.

No database migration, environment variable or dashboard configuration is required. Deploy with the existing `/var/www/bloodnet/deploy-prod.sh` command.

## Verification

- All 67 integration tests passed, including automatic new-country inclusion, inactive/organisation-only exclusion, full and partial pages, a one-donor country, strict API compatibility, service-city selection, category preservation, SQL/ORM parity and coordinate privacy.
- All 12 discovery unit tests passed.
- Country, donor-feed, modal and navigation UI checks passed. Country checks cover stale preference cleanup, a new country appearing on refresh, shared requests and preserving coverage through a refresh failure.
- The production build passed.
- Production-mode browser verification used synthetic data: a country with one donor returned 16 real cards with that donor first; Show More yielded 32 cards with only one occurrence of the local donor. The country selector contained exactly the three represented fixture countries. No production donor records were changed.

Screenshot: `artifacts/local-first-filled-donors-20261024.png`.
