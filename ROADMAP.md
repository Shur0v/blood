# BloodNet roadmap

Reviewed: **30 October 2026**. This is a direction for development, not a delivery schedule or a promise that every source feature is enabled on the live service. Patient records take priority over a separate clinician platform.

## Implemented in this repository

- Location/blood-group donor discovery, service cities, organ pledges and coverage definitions.
- Consent-based public profiles with separate phone visibility and administrator approval.
- Regional palettes, country defaults/city overrides, content/design controls and the Nepal-specific city presentation; a separate homepage draft/publication editor.
- Patient identifiers, encrypted report attachments, uploaded prescriptions, dated/searchable history and separate staff audit reads.
- Server-side provider prescription intake, duplicate-submission handling and queued email retries. A separate doctor portal is not included.
- Deployment checks, backups and supervised recovery tooling that requires configuration and rehearsal.

The [README](README.md) and linked technical notes explain boundaries and setup. “Implemented” describes code, not an independent production audit.

## Next — patient records and regional quality

| Priority | Intended improvement | Evidence of completion |
| --- | --- | --- |
| Medical-history usability | Clearer navigation, filters and document provenance | Synthetic patient workflows work on mobile, desktop and keyboard |
| Capture and retries | Clearer camera/file selection, readable previews and per-entry retry feedback | Interrupted uploads recover without duplicating saved entries |
| Access transparency | Explain existing patient access, staff audit access and prescription email delivery in the interface | Patient-facing copy agrees with actual permissions and channels |
| Regional refinement | Improve country/city presentation, localized guidance, accessibility and editorial consistency | Regional overrides, contrast, filters and canonical routes remain correct |
| Evidence discipline | Maintain monthly reach reports and begin consent-based outcome/partnership verification | Dated summaries distinguish reported and corroborated outcomes |

## Subsequent work — controlled access and durability

- Patient-controlled sharing and revocation with explicit recipients and authorization boundaries; design the permissions before adding links or access tokens.
- Patient-visible access history and clear documentation of which reads are recorded.
- Export/deletion workflows with defined treatment of attachments, delivered prescriptions, retained identifiers and backups.
- Private object storage for encrypted attachments, preserving authorized downloads and a tested migration path from database storage.
- Stronger isolated restore verification covering encrypted content, original keys, worker state and managed files.

These are planned capabilities, not claims about current sharing, audit-history or deletion controls.

## Longer term — clinician integration

A separate clinician portal may support verified doctors and patient-consented prescription delivery. It requires clinician authentication, registration/authorization verification, scoped permissions, consent records, integration credential management and security review. The current shared-secret endpoint does not supply those portal capabilities by itself.

Appointments, hospital integrations, automated diagnosis, clinical interpretation and diagnostic imaging workflows are outside this committed roadmap. New proposals require separate product, privacy and operational decisions.
