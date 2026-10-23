# Global navigation and current location behavior

## Menu change

The root layout now mounts the existing bottom Navbar once through SiteNavShell. Every HTML page using that layout receives it, including public donor profiles, regional/city pages, blogs, policies and administration pages. HomeExperience registers its existing callbacks with SiteNavigationProvider instead of mounting another menu. Registration is cleared on unmount, so standalone routes recover the global links. The provider keeps callbacks current without copying account data into global storage.

The Navbar's dimensions, responsive classes, colors and motion settings are unchanged. It is outside page-specific transformed/overflow containers. Homepage Home/Organ/Profile/Register actions still use the existing local experience. On standalone pages Home goes to `/`, Blog to `/blog`, Organ to `/organ`, and the account action to `/?profile=1`. A session check selects Profile versus Register. The menu adds no homepage content to SEO pages. API responses, robots, sitemaps and other non-HTML resources are not pages with navigation. Browser full-screen dialogs can intentionally cover background navigation.

## Country selection

`useDonorRegion` resolves country in this order:

1. A country forced by the regional route.
2. The visitor's saved manual country choice (`bloodnet_donor_country_v1`).
3. Automatic location detection.
4. No country constraint if none can be determined.

Thus `/india` stays India for a Bangladesh visitor. On `/`, a saved Pakistan preference wins over automatic Bangladesh detection. Coordinates and city are used only when their detected country matches the selected country.

## Automatic detection

`useViewerGeo` requests `/api/location/ip`, with a five-second client timeout and ten-minute browser-memory reuse. That endpoint first checks country headers from the reverse proxy/CDN. If a country header is present, it currently returns only the country; it does **not** enrich that response with a city lookup.

When no country header is usable, automaticIpLocation can ask Geoapify for the visitor's public IP country, city and approximate coordinates. This requires GEOAPIFY_API_KEY and correctly forwarded visitor-IP headers. It rejects local/private addresses rather than geolocating the VPS. Provider requests have a 3.5-second timeout and a bounded ten-minute process-memory cache.

If IP lookup fails, browser timezone and then language-region provide a country-only fallback. They cannot establish a visitor's city. Initial browsing does not request GPS permission.

## Donor retrieval and order

The blood search requests 16 entries, preserves the selected country, blood group and explicit text search, and normally uses NEWEST ordering (registered accounts before manual/community sources, then newest within a source). A detected city is used as an initial text-search constraint when the visitor has not entered their own search.

If that inferred-city search has no results, discovery retries within the same country with NEARBY ordering. If coordinates exist, coordinate distance sorts first; otherwise city/country ranks and deterministic recency ordering apply. Explicit text searches are not silently broadened. Country/category filters survive retries and pagination; failures are not treated as empty results. Service cities can make a donor relevant outside their main registration city. Entries lacking coordinates cannot have a measured distance.

The organ donor API puts coordinate distance before city/country and recency when coordinates are available. Blood's default NEWEST ordering means the two lists do **not** always follow identical distance rules. Background floating blood donor tags also use the default newest ordering. Internal donor coordinates are stripped from public responses.

## Dhaka example and accuracy

- Country header says Bangladesh, but no city: Bangladesh listings are selected; Dhaka-first cannot be promised.
- IP provider supplies Dhaka, Bangladesh: the initial automatic blood search looks for Dhaka matches; matches are newest-first, not strictly closest-first.
- No matching Dhaka entries: other Bangladesh results are offered with the same donation filters, using nearby ordering where coordinates permit.
- Manual country differs: that choice wins and incompatible Dhaka coordinates are not used.

There is no measured location-accuracy percentage in this codebase. IP location is approximate and can reflect a VPN, mobile gateway or internet provider. Timezone/language are weaker country hints. Browser location is an explicit opt-in action: high accuracy is requested, but the code does not apply a position.coords.accuracy threshold. Reverse geocoding must confirm a real country; sample-city fallback responses are rejected as confirmation. Permission denial leaves automatic detection usable. The confirmed result is shared in browser memory; a country choice can be persisted, while precise coordinates are not written to the saved country preference.

## Verification

The navigation UI regression passed: exactly one menu, standalone fallback, session label/active state, current callbacks and cleanup when leaving the homepage. All 12 discovery tests and the production build passed. Production-mode HTTP checks confirmed one server-rendered menu across the homepage, regional pages, blog listing/article, policies, donor directory/profile, organ page and administrator user list. Browser checks confirmed a visible fixed menu on a synthetic donor profile, the policy page and the custom 404 screen, plus working Home and local Organ actions. Next.js streams the not-found fallback through client recovery, so its final menu was checked in the browser rather than by counting initial HTML tags. The synthetic-profile screenshot is `artifacts/global-profile-navigation-20261023.png`.

Production configuration and real visitor IP/city accuracy still require live checks; this change does not alter location detection or search ordering.
