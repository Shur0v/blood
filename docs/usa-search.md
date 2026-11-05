# USA search and health-content improvements

Reviewed 6 November 2026. These changes improve clarity and search eligibility; they do not guarantee indexing, first-page results, traffic or registrations.

## Search intent, not keyword stuffing

USA country and curated area titles now explicitly describe a blood donor directory. City H1s identify the city and state; introductions explain donor registration and organization contacts while retaining the area's geographic limits. Published editorial heading overrides remain authoritative. Canonical routes, publication controls and donor algorithms are unchanged.

The main intents are **blood donor directory in [city/state]**, **blood donor contacts in [city]**, **register as a blood donor in [city]**, and relevant **free private medical-profile** information. These are intent-based editorial choices, not claims of measured search volume or competitiveness. Use Search Console query data after publication to refine wording based on actual impressions and useful actions.

Existing USA city, blood-group/city and country-qualified blood/organ metadata now describes recorded directory entries rather than promising active availability, rapid help or medical outcomes. Legacy records do not have reliable state fields, so their titles retain city + USA rather than guessing a state from the city label. Curated area pages have separately reviewed state context. Non-USA metadata is unchanged.

Google does not use meta-keyword tags for ranking. There are no hidden keyword lists, repeated city variants or fabricated “best”, “accredited”, “24/7” and “instant” service claims. Open Graph and Twitter tags improve sharing context; they are not presented as ranking guarantees.

## Useful visible content

Each curated guide's existing orientation section includes readable, server-rendered questions covering local contact discovery, the city's geographic scope, and the distinction between BloodNet registration and clinical donation scheduling. The answers link to FDA donation information, practical request coordination and private-profile information. This preserves the twelve-section recipe instead of adding filler sections.

Section visibility still applies. No FAQ rich-result eligibility, medical-professional review, clinical accreditation or local partnership is claimed. FDA sources support general donation-process guidance; BloodNet's own records support its directory figures. Eligibility and collection decisions remain with the collecting service. Private reports, prescriptions and neighborhood details remain outside public SEO.

Collection-page structured data now names its actual donor-directory subject, English language and publisher. It does not describe BloodNet as a hospital, blood bank or transplant allocator. Page titles, descriptions, headings, canonical tags and sharing tags have distinct roles. Existing organization-only and zero-listing explanations remain visible.

## Owner checks after deployment

1. Deploy normally with `bash ./deploy-prod.sh`. No migration or new environment setting is introduced by this follow-up.
2. Preview and review the USA country and curated areas in the administrator editor. New areas still require explicit publication; this update does not mass-publish them.
3. Inspect a published `/us/cities/...` URL in Search Console. Check its rendered page, canonical destination and indexing status. Review a USA blood-group route separately; only coverage-supported routes should be indexable.
4. Confirm the sitemap is reachable at `/sitemap-regions.xml` and its published URLs are included in the site's sitemap discovery. Submit the sitemap in Search Console if it is not already present. Unpublished previews and private records must remain excluded.
5. Monitor USA query impressions, clicks, registration completion and contact initiation. Separate country/city reports; do not treat worldwide account totals as local participation. Improve pages using real questions and verified coverage rather than broadening unsupported promises.
6. Keep sources and publication overrides accurate. Review healthcare claims when working integrations or service coverage changes. Do not add doctor, appointment or donation-inventory claims without confirmed operational support.

## Primary references

- [Google supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags): meta keywords have no indexing/ranking effect.
- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): descriptive content and links; avoid repetitive keyword stuffing.
- [Google helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): useful, reliable information and special care for health topics.
- [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies): keyword stuffing and doorway/scaled-content risks.
- [FDA blood donation information](https://www.fda.gov/consumers/consumer-updates/have-you-given-blood-lately): collecting-service screening and donation-process information.

Registry and copy: `src/lib/usaSeo.ts`. Local guidance: `src/components/usa/UsaLocalGuidance.tsx`. Existing component and recipe inventory: [USA content review](usa-content-review.md).
