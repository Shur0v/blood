# India presentation

`/india` has a dedicated orange-and-cream composition with fifteen default sections: introduction, search, matching cards, coverage, how it works, request preparation, blood groups, donor participation, organ pledges, private profiles, records/prescriptions, doctor availability, book support, guidance/FAQs and local exploration. Search and matching cards are two parts of the existing shared search component. Optional sections respect the existing regional visibility controls.

The resolved directory country selects India styling for city, blood-group/city, country-qualified blood and organ pages, and the India network overview. Old keyword redirects retain their existing destinations. Generic global pages do not become India pages because a visitor searches for an Indian location.

The existing regional editor still controls published copy, colors, optional sections, FAQs and approved images. Its India palette defaults to warm white, navy-charcoal, saffron and deeper green; saved overrides retain precedence. No decorative photographs or fabricated results are added. Current listing counts remain directory figures, not clinical availability or successful donations.

India donor pickers request batches of 18 so desktop three-column rows fill when matching entries are available. Blood and organ endpoints accept up to 18 per request and retain their default of 16 for existing callers. India uses a separate cache key for the larger batch; pagination continues from the server cursor. On the final partial row, genuine remaining cards expand to use the row rather than inventing placeholders or duplicating donors.

Indian SEO pages retain their existing server-rendered text, metadata, canonical URLs, structured data, links and route eligibility. Their presentation is scoped through `.india-page`; shared navigation, other countries and account screens keep their current appearance. Donor filters, pagination, contact dialogs, authentication, book payments and sponsored-copy requests reuse the existing flows and destinations. The support block is book access, not a new fundraising product. India does not show the legacy support component's sample numeric defaults while awaiting its statistics response.

Run `npm run test:india-ui`, the regional-content, donor-discovery, donor-ordering and SEO-content tests, `npm run guide:check` and the production build. Browser verification should cover `/india`, `/city/<Indian city>`, `/blood/<group>/<Indian city>`, country-qualified blood/organ routes and `/network/india` using synthetic directory fixtures. Compare SEO text and structured data with the same pre-change fixtures; check 320px, 390px, tablet and desktop widths, keyboard card activation, dialogs, empty/error results, request visibility, regional overrides and reduced motion. Check Nepal, Pakistan and Bangladesh for visual isolation.

There are no migrations or new service credentials. Release through the existing backup/build/deployment workflow; a repository push does not establish that production has been deployed.

## November 2026 local-page upgrade

The country landing page described above remains unchanged. Eligible local directories now use the separate sixty-component India Local Pages presentation, with twelve default sections and fixed per-area recipes. Twenty curated city guides and six state guides have their own publication workflow. This follow-up **does** require the additive IndiaEditorialPage migration; it performs no donor backfill or automatic publication. See [India Local Pages](india-local-pages.md) and its [release evidence and limitations](india-local-release/README.md) for current editor, geography, verification and rollout details.
