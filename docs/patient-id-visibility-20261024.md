# Patient ID card visibility

The user-facing patient ID card is hidden by default. Dashboard Overview now includes an administrator-only “Visible patient ID” switch. Turning it on reveals the existing card in every user profile; turning it off hides the card again. Administrator profile audits retain their read-only ID card.

This is presentation control only. Existing profile codes, uniqueness, six-month editing rules, copy/edit actions, patient identifier APIs, medical records and prescription routing are retained. Hidden cards stay mounted so revealing them does not reset their state or recreate IDs. Their hidden presentation removes them from keyboard/accessibility navigation.

The setting is stored in `PlatformSettings.patient_id_visible` with a false default. Migration `20261024090000_patient_id_visibility` adds this non-null Boolean column without modifying patient records. The root HTML provides the persisted initial state, and the existing PostgreSQL notification/SSE channel updates open profiles across tabs, devices and workers. Partial updates preserve the discovery toggle, advertising settings and theme. The control uses the existing authenticated administrator API, with its origin and session checks.

Validation passed:

- 74 database integration checks, including the default, administrator-only writes, invalid payloads, independent controls, live stream updates and unchanged identifiers/prescription records.
- Deployment audit covering 37 Prisma models, 49 database-backed GET routes, 31 populated legacy tables and all 20 migrations, including repeat deployment and schema parity.
- Patient ID visibility UI: hidden default, reveal/hide, copy/edit availability, cross-tab/server events, administrator audit and failed-save preservation.
- Existing discovery switch and six user/admin profile scenarios.
- Production build and browser verification: separate synthetic administrator/user views showed the card appearing and disappearing without reloading the user profile.

Screenshot: `artifacts/patient-id-visibility-switch-20261024.png` (synthetic data). All test writes were confined to local synthetic databases. Deploy with the existing `deploy-prod.sh` process to apply the migration and activate the switch on the live site.
