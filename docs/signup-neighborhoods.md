# Neighborhood selection at signup

The primary registration dropdown can store a verified neighborhood alongside its parent city. Public donor discovery and existing service-city selectors still use the city name, country and city coordinates. The database migration adds two nullable fields to the account; it does not rewrite existing records.

## Check before enabling

On a staging deployment with the configured Geoapify key, set `SIGNUP_NEIGHBORHOODS_ENABLED=true` and restart the application. In a new signup, search for Badda, Rampura, Banasree and Komolapur (also try Kamalapur), and check the parent city and country shown by each suggestion. Repeat with Bandra in Mumbai, Gulberg in Lahore and Thamel in Kathmandu. Treat a missing or ambiguous area as a city-only fallback; do not add an unverified area to the results. Verify a city-only signup and an area signup with test accounts.

Once the coverage checks pass, set the same server flag in the production environment and restart the BloodNet web process. The normal deployment applies the additive migration. The flag is off unless explicitly set to `true`.

To return registration to city-only suggestions, set the flag to `false` and restart. This does not delete saved areas, change public discovery, or require a schema rollback. A signup already in progress with an area selection must select its city again.
