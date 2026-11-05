# Pakistan regional presentation

Pakistan uses a separate forest-green, warm-white and mint composition. `/pakistan` is the canonical country entry; `/pk` permanently redirects there. The presentation applies to resolved Pakistan city, blood-group/city, country-qualified blood and organ directories, and `/network/pakistan`. Visitor location alone cannot apply the Pakistan edition to another country's page. India, Nepal, Bangladesh, the root homepage and shared bottom navigation retain their designs.

## Country sections and controls

The default country layout has fifteen sections: introduction and authentication; local/global statistics; filters; donor results; participating cities; how it works; request preparation; blood groups; donor registration; organ pledges; private-profile demonstration; reports/prescriptions and doctor-service availability; existing book/support flows; approved updates/reading; and safety/FAQs/next action. The filter and donor-result sections are rendered by the existing shared Hero component.

Overview → Regional editor → Pakistan controls published headings, copy, palette, layout, spacing, FAQs and approved images. Country defaults and city overrides keep their existing precedence. Hidden sections `locations`, `home5`, `join`, `guidance`, `home9`, `home12`, `gallery` and `faq` govern their corresponding content; hiding a section does not remove the protected search or donor results. The request-preparation builder still requires the existing city donation-request visibility switch. No new or duplicate switches are introduced. Withdrawing an override reveals the applicable default.

The support section keeps the existing book tiers, checkout and sponsored-copy form. It is not a new fundraising integration. Numbers load from the existing statistics endpoint; failed or pending loads display a dash rather than legacy sample figures. Pakistan donor entries are labelled separately from worldwide registered accounts. Location coverage can overlap and is not a count of unique people or available blood units.

No decorative external photographs, fabricated donor records, local stories, doctor listings or partner services are added. Approved regional images retain the current media/SEO workflow. Medical-profile demonstration data is labelled fictional. Doctor destinations remain subject to the existing verified service-availability configuration.

## Verification and deployment

Run `npm run test:regional`, `npm run test:discovery`, `npm run test:seo`, `npm run test:pakistan-ui`, `npm run test:india-ui`, `npx tsx tests/regional-ui.mjs`, type checking, guide coverage and the production build.

For browser/SEO comparisons, use an isolated PostgreSQL preview with fixed synthetic users in Pakistan, India, Nepal and Bangladesh. Capture the previous production build before rebuilding. `node tests/pakistan-browser.mjs --baseline` writes baseline screenshots. After building the new version against the same fixture, run `node tests/pakistan-browser.mjs` and `node tests/pakistan-seo-preservation.mjs`. The harness defaults to localhost port 3105 and refuses non-local origins. `BLOODNET_PREVIEW_URL`, `BLOODNET_PREVIEW_ARTIFACTS` and `CHROME_PATH` can configure the local harness. It exercises pagination, category filtering, keyboard donor contact and login without submitting forms or payments. Browser artifacts are synthetic, not production donor screenshots.

Check both themes and reduced motion, empty/error states, saved country/city overrides, optional-section visibility and request visibility. Compare representative SEO text, metadata, canonicals, structured data and links; the country landing composition itself intentionally changes. Check `/pk` for a permanent redirect and verify it is not a duplicate indexable page.

No schema migration or new credential is required. Use the normal `bash ./deploy-prod.sh` release process and verify the live country/city examples afterward. A successful local build or repository commit is not evidence of production deployment. Revert the presentation commit through the normal release process if rollback is needed; existing content and stored donor data remain intact.

## Reviewed release artifacts — 5 November 2026

The [verification record](../artifacts/pakistan-edition-verification.json) records the test results and limits of visual comparison. The country search counter is explicitly labelled worldwide entries; the separate country metric shows Pakistan entries. Existing SEO-page counters remain hidden.

Synthetic previews: [desktop](../artifacts/pakistan-landing-desktop.png), [tablet](../artifacts/pakistan-landing-tablet.png), [mobile](../artifacts/pakistan-landing-mobile.png), and [Lahore city page](../artifacts/pakistan-city-desktop.png). These demonstrate layout, not actual donor identities or production coverage.
