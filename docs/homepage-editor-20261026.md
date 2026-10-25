# Separate homepage editor

Open **Admin Dashboard → Overview → Homepage editor** after deployment. The regional editor remains separate.

## Controls

- Edit the donor-search heading and description, how-it-works heading, registration reminder, About introduction, FAQ introduction and final invitation text/buttons.
- Blank fields retain the original text, styled spans and line breaks.
- Show/hide 15 optional homepage sections without changing their existing order, design or functional components.
- **Save draft** stores changes privately and preserves the currently published homepage.
- **Publish homepage** applies the form to new homepage visits.
- **Reset draft to original** changes only the local form until saved/published.
- **Publish original homepage** restores original homepage copy and section visibility.
- Links open the existing image-slider, FAQ and site-wide theme tools. Those tools retain their existing independent publication behavior; their changes are not part of the homepage draft.

This is a bounded content and visibility editor, not an arbitrary HTML/CSS builder. Donor counts, filtering, contact privacy, account access, footer and bottom navigation cannot be overridden through its configuration. It applies only to the `/` homepage home view, not regional routes, the organ view, profiles or policies. No homepage settings are published automatically during deployment.

## Backend and deployment

Migration `20261026080000_homepage_editor` adds one independent `HomepageContent` table with separate draft/live JSON documents. It does not modify donor, blog, regional-content or authentication records. No default seed is required.

`GET/PUT /api/admin/homepage-content` recheck current administrator membership and credentials, reject managers/ordinary users, use private no-store responses and enforce a 32 KiB request limit and strict bounded schema. Plain text is escaped by React; arbitrary configuration keys are rejected. Publication uses a transaction/advisory lock. Sitemap homepage dates advance for meaningful public changes, not draft saves or identical publications. Public rendering reads only the live document and falls back to the existing homepage if optional CMS storage is unavailable before migration.

Production access is not available in this session. Deploy through the normal VPS workflow, including Prisma migrations:

```bash
cd /var/www/bloodnet && bash ./deploy-prod.sh
```

## Verification

- Production Next.js build passed.
- 80 database/auth/privacy regression tests passed, including draft isolation, real publication, no-op timestamps, restore, manager rejection and unchanged regional records. All 74 privileged API methods reject anonymous/ordinary-user requests.
- Real migration deployment passed: 31 populated legacy tables preserved, 23 migrations, schema parity, reconnect persistence, all 39 Prisma models and 51 database-backed GET routes verified.
- 29 configuration, discovery, ordering, regional, blog and SEO unit tests passed.
- Homepage editor UI checks passed for draft, publish, local reset, public restore, original JSX fallback, section visibility and registration button callback. Customized invitation headings preserve their line break.
- Browser-tested the actual editor component with a synthetic in-memory API on desktop/mobile; no mobile overflow.
- Default homepage hero geometry, fonts, colors and backgrounds exactly match the saved baseline at 390/768/1280 px; no horizontal overflow. Screenshots are in `artifacts/homepage-editor-default-*.png`.
- A temporary isolated database publication rendered custom text/hidden sections while preserving registration and the bottom menu. `/india` and Chennai did not receive homepage overrides. Main sitemap returned the publication date; anonymous editor requests returned 401. The temporary publication was removed after verification.

The editor screenshot uses synthetic local preview data, not the production dashboard. Existing animated lower sections were not asserted pixel-identical.
