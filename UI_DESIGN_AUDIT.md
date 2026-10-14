# UI and integration audit — 11 October 2026

Scope: repository structure, shared theme/layout, application navigation, authentication and location contracts, and the two screenshot surfaces. All 282 tracked source files participate in the TypeScript check; 70 API route files were inventoried. This is a UI integration review, not a live production service or security certification.

Changes:
- AboutBloodNet remains in the existing homepage and organ-page component layers, with its original terms callback. Added a light, responsive card layout, clearer hierarchy, readable text, and small hover interactions.
- AuthModal remains in its existing layer with the same props. Replaced translucent surfaces and white text with solid light surfaces and dark text, including login, verification, errors, suggestions, country options, and the existing date picker.
- Phone prefixes and dividers no longer shrink or wrap. The number inputs can shrink within the available width. Applied the same alignment fix to the shared CountryPhoneInput.
- Modal uses dynamic viewport height and a scrollable, shrinkable body. Scrollbars are hidden on the page, modal body, and modal menus without disabling scrolling.
- Pickers expand within the form's scrollable content instead of being clipped against the modal edge. Blood-group controls now use native buttons.
- Added linked input labels, autocomplete hints, dialog naming, and visible keyboard focus states.

Integration preservation:
- No application route, API route, backend service/controller/repository, middleware, Prisma schema, migration, dependency version, or parent navigation file changed.
- AuthModal code before the JSX return is identical to the original, including validation, requests, payload construction, credentials, city lookup timing, OTP handling, and success callbacks.
- AST comparison confirms all 38 AuthModal bindings and all 8 CountryPhoneInput bindings are unchanged (event handlers, values, disabled/required flags, and date limits).
- Existing onTermsClick behavior is retained.

Validation:
- TypeScript across the codebase: passed after generating the existing Prisma client.
- git diff --check: passed.
- Palette contrast: body text 7.24:1; input placeholders 4.55:1; white on crimson buttons 6.29:1; disabled button text 6.15:1.
- Desktop and 375 px mobile browser inspection: solid light modal, readable labels, aligned phone field, hidden scrollbar, working internal scroll. Final picker and About Us checks are recorded below after production verification.

Environment limits:
- This checkout initially had no node_modules and no .env. Installed dependencies from the unchanged lockfile.
- Prisma client generation uses a process-local placeholder DATABASE_URL; no database migration or database writes were run.
- Live database, SMTP, Geoapify, and OTP delivery cannot be certified without the actual runtime configuration. Their implementation and UI contract have been preserved.
- Production build: optimized compilation and type checking passed. Page-data collection is blocked by missing JWT_SECRET, SMTP_HOST, SMTP_USER, SMTP_PASS, and GEOAPIFY_API_KEY. A full production build and live service smoke test must be repeated with the real environment.
- Final browser validation: desktop About Us at 1280 x 900 and mobile at 375 x 812. No horizontal overflow in either requested surface. Modal country search/selection, blood group selection, login/register switching, phone validation feedback, and scrolling passed. The two responsive About Us layouts retain every original vision/mission message and the terms callback.
- Final TypeScript check with incremental output disabled: passed.

## Follow-up: FAQ, community, and Contact Us

- Restyled FaqSection, SocialMedia's community panel, and ContactUsSection to match About Us: light surfaces, slate text, crimson accents, rounded cards, and restrained hover/focus feedback.
- Desktop layouts use balanced columns; mobile layouts stack. FAQ now exposes expanded state and answer relationships to assistive technology. Contact inputs have visible, linked labels and status announcements.
- All API request/state code before each component render remains unchanged. AST comparison confirms the original FAQ toggle and all contact/community event, value, disabled, link, image, and ad bindings remain unchanged.
- The community ad rendering helper and Footer are unchanged after normalizing line endings. The admin-provided community content and Telegram destination remain dynamic.
- TypeScript across the codebase and git diff --check passed.
- Browser checks: desktop, 768 px tablet, and 320 px mobile; no horizontal overflow in the three panels. FAQ expansion and single-answer behavior passed. Contact submission was not sent during visual testing.
- Existing environment limitations from the earlier audit still apply; no route/backend/database/dependency changes were made.

## Expanded scope: patient IDs and private medical profiles

The user subsequently authorized additive database and backend features. The UI-only preservation statements above describe the earlier phases; this phase adds functionality while retaining existing route paths, user UUIDs, session cookies, OTP payloads, service-city handling, and health/organ save contracts.

- Refreshed the profile with solid light surfaces, readable slate text, consistent cards, responsive controls, visible focus, and small interactions. Existing photo, health, verification, city, organ, and story controls remain connected to their original handlers.
- Added unique four-character letters/numbers IDs, immediate first customization, database-enforced reservation, and a server-enforced six-calendar-month cooldown. Retired IDs are reserved to prevent a prescription reaching a different patient.
- Added patient-owned encrypted report metadata/files and prescriptions, paginated inboxes, authenticated downloads, and a future doctor-backend endpoint. Email is queued for a supervised worker with retries; the endpoint does not wait on SMTP.
- Added Bone Marrow to the shared catalog, matching icon, aliases, SEO mapping, and donor SQL normalization. Existing dynamic string database fields store the new option without replacing their schema.
- Validation: all 18 unit/integration checks passed against a fresh isolated loopback PostgreSQL database, including historical migration replay/backfill, existing OTP signup/session/cities, concurrent ID claims, cooldowns, ownership, encryption, email retry/idempotency, authenticated doctor submission, and Bone Marrow saving/search. No live emails were sent.
- Browser validation with a synthetic patient: desktop 1280 px, mobile 390 px, and narrow mobile 320 px; no horizontal page overflow. ID availability/save/cooldown/copy, prescription expansion/read state, and private report upload/expansion passed. Screenshots are stored in the chat's visualization folder.
- TypeScript and whitespace checks passed. A complete optimized Next.js production build also passed in an isolated temporary checkout with local test configuration, including page generation. Production migration, live SMTP delivery, and the future doctor website connection require the actual deployment configuration; see `MEDICAL_PROFILE_INTEGRATION.md`.

## Follow-up: compact profile, mobile filters, and navigation

- Desktop profile header now allocates 30% of its grid to photo/name/patient ID on the right and 70% to the existing service-city controls on the left. The header stacks on mobile. ID editing uses a labeled pencil icon without the Customize text.
- The profile has a subtle moving rose/violet gradient, disabled for reduced-motion preferences. A highlighted Medical Records button opens the report form and record tabs; the form is absent before the button is clicked and when collapsed.
- Existing signup continues to reserve a cryptographically random available four-character ID in its original transaction. No ID-generation, backend, migration, or API contract changes were needed for this follow-up.
- Blood filters share one responsive control: eight blood groups in two rows of four on mobile, then a full-width search input. All groups remains available above the grid. Organ filters use four labeled/icon options per mobile row, including Bone Marrow, followed by the same blood/search controls.
- The bottom menu retains its brand, three navigation icons, and Register/Profile action at every checked width. Consistent styling, bounded width, fixed-size icons, and tighter spacing prevent clipping; the menu respects the bottom safe area.
- Verification: TypeScript and whitespace checks passed. Direct comparison confirms donor query construction and fetch calls are unchanged in Hero and OrganHero. Browser checks verified 320 px blood/organ filters, selection/search, all five menu buttons within the screen in both authentication states, the desktop 70/30 proportions, hidden/expanded/collapsed medical form, and profile gradient animation. Synthetic profile preview used fixture responses only; it did not repeat live service verification.
- The prior complete production build and 18 database tests remain recorded above. This follow-up changed presentation and disclosure state only.

## Follow-up: donation reminder card

- Refined DonorReminder with a compact icon/eyebrow, a stronger opening sentence, a lighter supporting sentence, comfortable body spacing, and a clear Register Now action. Desktop places the action beside the copy; mobile uses a full-width button.
- All original wording, the `glass soft-moving-bg` background, registration callback, and button-visibility prop are preserved. Added a named section, keyboard focus styling, decorative icon labels, and reduced-motion support for entrance/button effects.
- TypeScript and whitespace checks passed. Isolated component browser checks verified 320 px and 337 px mobile widths and 1280 px desktop without horizontal overflow, the unchanged heading text/background, the registration callback, and hiding the button when its visibility prop is false.
- The main browser showed the existing missing-runtime-environment error during this check; the isolated preview verified layout and callback behavior without contacting backend services.

## Follow-up: mobile organ request disclosure

- Below the existing 768 px form breakpoint, RequestOrgan initially shows only Required Organ and Recipient Full Name. A mobile-only placeholder ensures choosing any organ, including the existing Kidney default, reveals the rest of the form.
- Other controls remain mounted to preserve draft data, but are hidden and disabled while the mobile first step is incomplete. Desktop shows the original full form and default selection. Starting another request resets the disclosure state.
- Submission logic, upload calls, payloads, validation, and backend routes are unchanged; direct comparison confirmed the original submit handler is identical.
- TypeScript and whitespace checks passed. Isolated browser checks verified exactly two visible controls initially at 337 px, revealing and enabling all details after choosing Kidney, retained name data, and no hidden-field validation error when Enter is pressed initially.
- Desktop comparison at 1280 px found identical form height (785 px) and identical positions/dimensions for all eleven visible controls in the original and updated components. No actual medical request was submitted during verification.

## Configuration error and deployment safeguards (2026-10-11)

- Root cause: this checkout has no private environment file; server credentials were undefined. Database initialization also validated unrelated SMTP, Geoapify, and media variables. Database reads now validate database settings separately, while full production checks still require the operational configuration.
- Blank optional R2_PUBLIC_BASE_URL from the supplied example now validates when local storage is explicitly enabled. Production database query logging is disabled to avoid logging private medical payloads.
- Blog listing/detail handle database failures with a safe retry screen, without rendering a server stack trace or credential details. Missing article behavior remains a real Next not-found response. Added a route error boundary for unexpected failures.
- Health endpoint now handles unavailable configuration without an import-time mailer exception or an unguarded diagnostics exception.
- Deployment verifies production settings/database/SMTP before schema changes, builds first, requires a custom-format pg_dump backup, pauses old PM2 processes for migration, verifies ID backfill and a sample encrypted record, reloads app/worker, and checks HTTP health. Missing credentials, a wrong encryption key, and an unavailable backup tool stop deployment. All application instances must join the maintenance window. A failed migration leaves local services paused for investigation.
- Worker and scripts load environment files using the same precedence as Next. Existing database URL, JWT key, and medical encryption key must remain unchanged. No production secrets were generated or replaced.
- Verification: 19 medical tests passed on fresh isolated PostgreSQL, including an exact JSON comparison of every preexisting table across migration and an existing session using all added medical features. Two environment/health tests passed. TypeScript passed. Complete production build passed; blog listing and detail were verified using synthetic data through a production Next server. Configuration/schema acceptance, wrong-key rejection, and missing-backup-tool rejection were verified separately. Successful real pg_dump/restore and production SMTP require the deployment host; neither was available locally.
- No live database or user data was modified. The live deployment remains dependent on supplying the actual private server configuration.
- Screenshot: `C:/Users/Backtend/.codex/visualizations/2026/10/11/01a1284b-3801-7b91-a115-6622780ea842/ui-audit/blog-production-verified.png`.

## Sitewide typography refinement (2026-10-13)

Audited frontend font imports, families, weight classes, and explicit font declarations across public pages, donor and organ screens, registration forms, medical/profile components, editorial/legal pages, and admin screens. No decorative/cursive font imports were present. Replaced 800/900 weight utilities with 600/700 equivalents and reduced tracking-widest labels to tracking-wide. Inter now loads only 400, 500, 600, and 700 weights. Its CSS variable is resolved with @theme inline so the Next font applies to body and inherited controls consistently. Imported article markup follows Inter, while semantic code content retains a monospace font; stored content is unchanged.

TypeScript and diff whitespace checks passed. Browser checks on the dedicated BloodNet preview at port 3212 confirmed Inter on body, headings, form inputs/buttons; zero reviewed controls/headings exceeded weight 700. Registration checked at 375px without horizontal overflow. Homepage and organ directory interactions rendered correctly. Port 3000 was serving another project and was not modified or stopped. No APIs, data models, routes, or stored user records changed for this typography request. Database-dependent content remains unavailable in this checkout without private environment settings.

Screenshot: `C:/Users/Backtend/.codex/visualizations/2026/10/11/01a1284b-3801-7b91-a115-6622780ea842/ui-audit/typography-home-desktop.png`.

## Profile design verification (2026-10-13)

Started BloodNet's Next development server at http://127.0.0.1:3002/ and the actual UnifiedDashboard/Navbar components in a marked synthetic-patient preview at http://127.0.0.1:3210/. The checkout has no private environment file; no real account or production database was used.

Checked desktop 1280px, mobile 375px, and narrow mobile 320px. Confirmed desktop cities-left/identity-right alignment, hidden report form until Medical records expands, Reports/Prescriptions tab navigation, Bone Marrow presence, and font weights no higher than 700. No input/select/textarea/button extended past the viewport. The final submit button has about 70px trailing clearance; the 50px fixed menu and 16px bottom inset do not cover it.

Found and fixed the ID editor input shrinking to clip four characters at 320px. It now gets a full row on small screens and retains a compact basis at larger widths. Verified WWWW fits in a 220px input at 320px. Removed the monospace styling from the donor-status label to match the rest of the profile typography; ID text still uses monospace for character clarity. API calls and data logic were not changed. TypeScript and diff checks passed. No uploads or ID saves were made.

The preview and app were left running for user review. Screenshot: `C:/Users/Backtend/.codex/visualizations/2026/10/11/01a1284b-3801-7b91-a115-6622780ea842/ui-audit/profile-id-mobile-verified.png`.

## Country-first signup phone field (2026-10-13)

Registration now renders the local-number input only after phoneData.countryCode is selected. Initial validation text for the hidden input is also hidden. Country search, country-switch clearing, dial-code display, number formatting/validation, and signup payload logic are unchanged. Browser checks confirmed zero Local phone number inputs before selection, Bangladesh +880 revealed the field, short-number validation and valid-number feedback worked, and switching to United States +1 cleared the old number. No signup or email was submitted. TypeScript and diff checks passed. Screenshot: `C:/Users/Backtend/.codex/visualizations/2026/10/11/01a1284b-3801-7b91-a115-6622780ea842/ui-audit/signup-country-first.png`.


## Completed medical records and dashboard review (2026-10-14)

The profile identity remains on the left desktop column as requested. Report/prescription upload now supports image previews and full-size zoom, multiple independent entries with multiple pages, camera capture input, 29 report categories, optional clinical metadata and result rows, encrypted compressed images, retry-safe saves, private date-ordered/searchable timelines and patient-uploaded prescriptions with doctor/date fields. PDF originals remain unchanged. The medical upload UI was exercised against actual local API handlers and a disposable synthetic-patient database. Two reports and one patient prescription were saved and appeared in clinical-date order. The 320px/375px profile and image viewer fit the page without horizontal overflow.

The admin shell has a persistent light/dark control, restrained typography and surfaces, responsive navigation, functional tool search, existing navigation URLs and new aggregate Medical Operations. Patient IDs are visible/searchable in the users module. Existing table/FAQ fields and actions retain their routes. The mobile drawer and FAQ manager were checked at 320px; light/dark state persists across navigation/reload.

The heatmap now overlays the actual current public page at a selected device width, with weighted density for all matching document clicks and totals sourced from click analytics. Real browser filter clicks aligned with the corresponding controls in the preview. Older viewport clicks are retained and explicitly separated from reliable document mapping. Preview traffic does not generate analytics. A first-load policy initialization race discovered during preview checks was fixed without modifying existing policy content.

31 isolated tests, TypeScript, production build and 18 admin GET checks passed. Production data was never accessed or modified; deployment must apply the additive migrations using the existing backup/configuration checks. No real email was sent and physical camera capture was not exercised.

Evidence: artifacts/medical-image-mobile.png and artifacts/admin-heatmap-dark.png.


## Dashboard completion and heatmap attribution follow-up (2026-10-14)

Refined the overview's eight original metrics and retained its existing fields/endpoint. Replaced the decorative traffic placeholder with actual today/week counts and the existing top-action value, plus working click-analytics/heatmap/medical-operations shortcuts. Priority queue entries now link to the existing review workflows. Network/API failures are caught and shown with the last successful data instead of producing unhandled fetch rejections; background polling pauses when hidden.

The FAQ manager keeps the same GET/POST/PUT/DELETE endpoints and fields. Its new workspace adds published/hidden/total counts, labeled form controls, local question/answer search and publication filters, and expandable editors that retain in-memory edits while filtered. Existing question/answer/order/publication data remains unchanged. Browser verification created and updated only a new synthetic FAQ in the isolated preview, confirmed publication counts and search filters, and reviewed the layout in light/dark modes and at 320px without page overflow.

Fixed route attribution for pages with GlobalHomepageContinuation: /faq interactions now remain under faq instead of being overwritten by its shared home section. Profile overlays retain their private page marker. Tracking now starts with client hydration instead of waiting for an idle callback. Page identifiers allow long and encoded public routes; private/unsafe preview paths are rejected. Added All time (days=0) to the existing heatmap endpoint/UI, preserving historical count rows and viewport-only points. Filter changes hide stale results until matching data arrives. Verified a real /faq filter click produced exactly one faq click and mapped point while the two prior home clicks stayed unchanged (site total 3).

The 31-test isolated database suite passed again with all-time legacy-history and route-attribution assertions. TypeScript and the final production build passed. Screenshots: artifacts/admin-faq-light.png, artifacts/admin-faq-dark.png, artifacts/admin-overview-dark.png and artifacts/admin-faq-mobile.png. The admin preview remains isolated test data; production user data was not accessed or modified.
