# Contributing to BloodNet

Start with the [README](README.md) for setup and the [roadmap](ROADMAP.md) for priorities. Bug fixes, accessibility improvements, tests and accurate documentation are welcome.

## Propose and implement a change

1. Search existing issues. Use the bug or feature template for public, non-sensitive work. Discuss substantial behavior, schema or integration changes before building them.
2. Fork the repository or use an authorized checkout. Create a focused branch and initialize a separate development database using the README instructions.
3. Follow existing TypeScript, service and route patterns. Preserve patient ownership checks, staff authorization, request-origin controls, accessible interactions and truthful directory counts.
4. Run relevant checks and inspect affected interfaces at mobile and desktop sizes. Use synthetic accounts, documents and donor listings only.
5. Open a pull request describing the problem, resulting behavior, verification and limitations. For schema changes include migration, compatibility and recovery considerations; do not reset production data.

## Verification expectations

| Change | Relevant starting checks |
| --- | --- |
| Environment/setup | `npm run test:env` |
| Sessions, authorization or public input | `npm run test:security` plus affected route/integration checks |
| Discovery and counts | `npm run test:discovery` |
| Regional pages | `npm run test:regional` plus keyboard, mobile and contrast inspection |
| Medical records or prescriptions | `npm run test:medical`, including isolated integration cases where behavior depends on the database |
| Deployment/schema | `npm run test:deployment` on disposable infrastructure |
| Documentation | Check claims against code, links, commands, examples and privacy; new tests are not required for prose alone |

The README explains `TEST_DATABASE_URL` and recovery prerequisites. Explicitly report skipped database/browser cases. Do not present old audit results as current verification. A build is useful for runtime changes when its environment is available; no production deployment is required for a contribution.

## Privacy and evidence

Never include real patient records, donor contact details, production logs, credentials, database dumps or private dashboard screenshots in Git, public issues or external coding services. Use fictional fixtures and synthetic screenshots. Outcome collection belongs in a restricted process with consent, not in an issue thread; only approved aggregate summaries belong in public impact documentation.

Report vulnerabilities through [SECURITY.md](SECURITY.md), not public bug reports. Use respectful, specific communication. Do not make clinical eligibility, diagnosis or treatment claims on behalf of the platform.

## Licensing contributions

Submit only work you are authorized to contribute under the project's [AGPL-3.0-only terms](LICENSING.md). Preserve notices and disclose third-party sources, licenses and attribution. Do not introduce assets with unknown redistribution rights. Contribution does not require transferring copyright to the maintainer.
