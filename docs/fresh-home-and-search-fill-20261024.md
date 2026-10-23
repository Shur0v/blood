# Fresh Home navigation and blood-group search filling

## Changes

Both the Home icon and BloodNet logo navigate to `/` with a fresh document load, including repeated clicks while already on the homepage. This clears temporary page/search/category state, drops profile URL intent and performs fresh server and donor-feed reads. Session cookies and the selected country preference remain intact. The root route is dynamic and donor requests use no-store. Saved cards remain an explicitly labelled fallback during an outage, not a claim of live freshness.

Browse-mode searches now send `preferSearch=true` alongside `expand=nearby`. Exact city/country matches rank first, then other text matches, followed by the existing local-country and nearby suggestions. Blood group and organ filters remain hard constraints. A- searches therefore never fill space with O+ or unknown-group entries. A city or country with few/no matches no longer limits the feed to a short result set when enough category matches exist elsewhere. Explicit search text remains visible in the input so the visitor can understand or revise the search. The floating-plus modal explains broader suggestions.

SQL blood/organ queries implement the preference before the locality/distance tiers. The blood ORM recovery comparator implements the same ranking. Registered donors' service-city matching remains supported. Pagination keeps the effective query and category. Strict APIs and existing expanded API consumers that omit `preferSearch=true` retain their previous text constraint for compatibility. Card caches move to version 6 so old short search results cannot be mistaken for the new browse behavior during recovery.

The landing page classes, layout, typography, animations, filters and card design are unchanged. If the database genuinely contains fewer category matches than a full page globally, the list stops honestly instead of inventing or repeating donors.

## Database and backend verification before push

No schema, migration, environment variable or dashboard setting is required. Existing active donor/account tables and service cities supply the results. Live production data was not changed; all inserted QA donors were confined to a guarded local synthetic database.

- All 69 integration-suite checks passed. The additional tests cover full A-, O+ and AB- search pages, cross-country search priority, unknown location searches, exact city names versus donor-name matches, unique pagination, SQL/ORM recovery parity, organ-category preservation and legacy API compatibility. Existing privacy/administrator/database checks also passed.
- All 13 discovery/navigation unit checks passed, including repeated fresh-root Home navigation.
- Donor-feed and shared-navigation UI checks passed.
- The production build passed.
- A production-mode browser showed 16 O+ cards for Odisha with the local Odisha match first, 16 A- cards, and 16 AB- cards for an unknown location search, without mixing categories.
- After adding a synthetic Nepal donor **after** loading the page, clicking Home cleared the text search, selected All groups, updated the server-rendered network count from 135 to 136 and displayed the new donor first in a 16-card page.

Preview: `artifacts/blood-search-fill-20261024.png`. Deploy the pushed code using the existing VPS deploy script; these checks do not claim the live server has already been deployed.
