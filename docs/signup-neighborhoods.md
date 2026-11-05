# Country-aware city and neighborhood selection

Location search starts after three characters in registration and profile pickers. It searches within an explicitly written full country name first, otherwise the detected visitor country, otherwise the signed-in account country. When these are unavailable, the picker asks for a country selection. Country restrictions also apply when neighborhoods are disabled. Phone country, browser language and timezone guesses do not silently choose a search country.

`badda` in Bangladesh searches matching verified names throughout Bangladesh. Adding a city or district narrows the results. `Gujrat, India` explicitly searches India even for a visitor in Bangladesh. Full country names are matched case-insensitively at word boundaries; partial names and short codes in free text do not override detection. A country selected in the fallback selector is used only when automatic/account country information is unavailable.

Geoapify requests and returned records are country-filtered. Text relevance is ranked first, then proximity among similarly relevant matches. A confirmed GPS fix already available in the app can supply a distance hint within the selected country; otherwise approximate IP coordinates can be used. No GPS permission prompt is opened by typing. When compatible coordinates are unavailable, nationwide matches remain available without a nearest claim. Distance hints do not change stored city coordinates or donor ordering.

Geoapify supplies supported areas with a confirmed parent city. Buildings, streets and ambiguous parent cities are excluded. Each request considers up to 20 candidates and eight distinct parent contexts, with at most three parent lookups concurrently. Provider coverage and response bounds mean a short query is not an exhaustive directory of every place. Add more letters, city or district to refine a capped list. Country, query, lookup mode and proximity context separate cache entries. Failures retain only verified fallbacks in the selected country, with a useful message when no verified result is available.

## Reviewed fallbacks

The reviewed Dhaka directory contains Badda, Merul Badda, South Badda, West Rampura, Banasree, Gulshan and Mohakhali. Names are not synthesized from directional prefixes. Badda and Merul Badda were checked on 5 November 2026 against OpenStreetMap locality records and their Dhaka/Bangladesh hierarchy. Their stable BloodNet identifiers use the `bloodnet:` namespace. The other five entries retain the earlier reviewed directory. Area ordering falls back to the parent-city point where area coordinates are unavailable. [Badda locality](https://www.openstreetmap.org/node/5167233263), [Merul Badda locality](https://www.openstreetmap.org/node/9028978730)

Queries for East Badda, West Badda and New Badda did not independently confirm locality records during this review. Unrelated business and landmark results were rejected. These names may appear when the configured provider returns valid area records with confirmed parents. Expand the directory after verifying a locality and its parent, not by assuming that every directional variant exists.

## Saving and editing

Enable neighborhood choices with `NEIGHBORHOODS_ENABLED=true`. If absent, the previous `SIGNUP_NEIGHBORHOODS_ENABLED` setting applies. The feature defaults off; a new deployment alone does not enable it.

Primary and additional signup locations use the same country-aware area lookup. Signed selections expire after ten minutes. OTP completion verifies every selected area and saves all locations atomically. New service-location fields are nullable, and existing rows receive no backfill. City-only signup payloads remain supported.

Each service city can hold one private optional neighborhood. Up to five parent cities are retained. Selecting an already-listed city's area offers an explicit Update neighborhood action, preserving the original record, coordinates and removal deadline. City-only additions retain the 30-day removal lock. Existing duplicate legacy city entries are retained; new duplicate parent-city additions are rejected. Clearing an area removes only its private neighborhood metadata.

The primary neighborhood editor is restricted to the account's current primary city and country, even while travelling. It offers Save, Cancel and Clear. The primary account neighborhood and corresponding primary service entry synchronize on deliberate edits. Primary-city changes clear or replace the old account neighborhood transactionally. These operations preserve private authorization, origin protection and signed-proof checks.

Public donor responses, profiles, SEO, analytics, city counts and donor matching continue to use city-level information. Neighborhood names and IDs are returned only through authenticated owner interfaces.

## Deploy and enable on the VPS

Run the normal deployment, which applies `20261105120000_service_city_neighborhoods` additively:

```bash
cd /var/www/bloodnet
bash ./deploy-prod.sh
nano .env.production.local
```

Add or update the following setting once, retaining your existing private `GEOAPIFY_API_KEY`:

```dotenv
NEIGHBORHOODS_ENABLED=true
```

`.env.production.local` takes precedence over `.env`; using the same value in both is compatible. Existing process environment variables take precedence over both files. Restart with the intended value explicitly and save the PM2 process configuration:

```bash
export PATH="/var/lib/bloodnet/node-runtime/node_modules/node/bin:$PATH"
export NEIGHBORHOODS_ENABLED=true
pm2 restart bloodnet --update-env
pm2 save
```

The web process serves these pickers. Existing prescription/recovery worker configuration can remain as deployed. Verify live registration and profile searches in Bangladesh, India, Pakistan, Nepal and other intended markets with the actual configured provider key. Check short queries, variants across districts, country overrides, multiple signup areas, updates, locks and provider failures.

Rollback neighborhood choices by setting the file and exported value to `false` and repeating the restart. Saved neighborhoods remain stored and country filtering stays active. In-progress area signups must select their cities again.
