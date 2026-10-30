# Codex for Open Source — BloodNet support request

Prepared **30 October 2026** for maintainer review and submission. This document has not been submitted and does not imply acceptance. Project: [bloodnet.live](https://bloodnet.live). Repository: [Shur0v/blood](https://github.com/Shur0v/blood). Maintainer account: [Shur0v](https://github.com/Shur0v).

## Application statement

I maintain BloodNet, a donor-discovery platform that helps people find local blood donor listings and voluntary organ pledges, with a patient-records-first direction for private reports and prescription history. I am applying for six months of ChatGPT Pro with Codex, conditional Codex Security access for the repository, and API credits for defined open-source maintenance workflows.

BloodNet combines location-aware discovery, consent-based public profiles, regional landing-page configuration, patient-owned document workflows and administrative operations. Maintaining these capabilities requires attention to access control, truthful directory counts, migrations, backup recovery and dependable releases. The medical workflows are especially important to review carefully: records are encrypted at rest with server-held keys, patients have ownership-checked routes, and authorized staff have separate audit access. A separate clinician portal remains future work.

The project has measurable early reach. Maintainer-provided Simple Analytics screenshots recorded 173 visitors and 288 pageviews during 15–30 October 2026. The selected twelve-month Google Search Console window recorded 206 clicks and approximately 1,860 impressions; the selected three-month window recorded 39 clicks and 305 impressions. These overlapping measures establish early activity, not widespread adoption or clinical outcomes. Some site activity may include administration and testing. Completed donations, lives saved and formal partnerships are not established by the evidence currently assembled.

The repository includes automated checks for medical records, discovery, security, regional content, migrations and operations. BloodNet is documenting its AGPL-3.0-only licensing for original code, contribution process, security reporting, evidence limitations and staged roadmap so others can understand and contribute to the project. I want support to turn recurring maintenance work into more consistent, reviewable engineering practice while improving the patient-record experience.

## How I would use the support

| Workflow | Proposed use of Codex / API credits | Reviewable result |
| --- | --- | --- |
| Access-control review | Examine patient/staff boundaries, public-profile consent and private-file routes; request conditional security coverage | Reviewed findings and focused fixes with cross-account/role regression checks |
| Discovery regression work | Review location/group matching, service-city ordering, pagination and source-record counts | Tests using synthetic fixtures and documented counting behavior |
| Regional accessibility | Check country/city overrides, draft publication, keyboard navigation and contrast | Reviewed changes with mobile/desktop and keyboard evidence |
| Migration and release review | Assist with pull-request summaries, compatibility checks and deployment-check output | Maintainer-approved release notes and isolated migration verification |
| Prescription delivery | Review duplicate submissions, patient-ID changes, email claiming and retry behavior | Synthetic integration tests and reviewed failure-handling changes |
| Recovery readiness | Help inspect isolated restore rehearsal results and encrypted-record preservation | Repeatable rehearsal evidence with explicit limitations |

Pro with Codex would support interactive implementation, investigation and review. API credits would be used for maintainer-triggered pull-request review summaries, test-failure triage and release/migration checklist drafts. This automation is proposed, not already deployed. I would start with bounded runs, record usage and establish a budget from measured consumption rather than claim an unsupported credit amount.

Any automated workflow would use source code, synthetic fixtures and redacted diagnostic output. Production patient records, credentials, private analytics exports and identifiable donor data would not be supplied. Automation would produce suggestions for maintainer review; it would not autonomously merge changes or operate on production databases. Security access would be limited to repositories I am authorized to administer.

## Why this project merits consideration

BloodNet is early-stage and does not yet demonstrate broad software-ecosystem adoption. Its case is a public-interest service with active engineering work, recorded early usage, and a concrete maintenance burden around donor discovery and sensitive document workflows. Support would help improve reliability, contributor accessibility and verification as the project develops. I would report progress through reviewed changes, reproducible checks and dated evidence, without equating traffic or listings with clinical impact.

## Evidence and submission review

- [Project overview and setup](../README.md), [contribution guidance](../CONTRIBUTING.md), [licensing boundaries](../LICENSING.md), [security reporting](../SECURITY.md), and [patient-first roadmap](../ROADMAP.md).
- [Dated impact report and screenshot provenance](impact/2026-10-30.md), including limitations and a process for future outcome/partnership evidence.
- Historical technical reports in this repository describe their own verification; they are not a new production audit or independent security certification.

Before sending, the applicant should confirm their current maintainer role/write access, repository identity, licensing authority for original contributions, and the accuracy of personal statements. Share private evidence only through an appropriate application channel and only when necessary. Do not present the documentation work as an exhaustive clearance of third-party assets.

The [official program page](https://developers.openai.com/community/codex-for-oss) describes six months of Pro with Codex, conditional security access and API credits for eligible OSS work; it also invites projects with an important ecosystem role to explain their case. [Program terms](https://learn.chatgpt.com/docs/codex-for-oss-terms) make selection discretionary and additional benefits subject to review. Re-check these sources when submitting. No acceptance or funding amount is assumed here.
