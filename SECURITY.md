# Security reporting

## Report privately

Use the **Contact us** form on [bloodnet.live](https://bloodnet.live/#contact-heading) to send a short initial message such as: “Security report: I would like to arrange a private discussion about a possible access-control issue.” Include your reply email and a broad affected area, without sensitive details.

The form sends a message to the operator; it is not an encrypted vulnerability-submission portal. It rejects links and certain technical payloads and limits message length/rate. Request a suitable private follow-up channel before sending reproduction payloads, attachments or detailed evidence. If a submission fails, retry a plain-language coordination message without links or code. No dedicated security mailbox, GitHub private-reporting setting, response deadline or bounty is promised by this policy.

Do not put vulnerabilities, patient information, credentials, medical records or production evidence in public issues. If the form is unavailable, keep details private and wait for a working maintainer contact channel rather than posting an exploit publicly.

## Information for private follow-up

Once a channel is agreed, provide the affected version/commit and component, expected and actual behavior, minimal steps using synthetic accounts, impact, and any proposed fix. Redact tokens and personal information. Coordinate disclosure with the maintainer after validation and remediation.

Test on local or explicitly authorized environments. Do not retrieve another person's records, change production data, send unsolicited prescription emails, or run intrusive scans against the live service. This policy does not grant permission to test third-party systems.

## Maintenance boundaries

Reports concerning the current main branch and current service are relevant; there is no defined long-term support matrix for historical versions. Medical data uses server-side encryption at rest and ownership checks, with separate authorized ADMIN/MANAGER audit access. It is not end-to-end encrypted. See [medical documentation](MEDICAL_PROFILE_INTEGRATION.md) for current interfaces and key-management requirements. The existing [security review](SECURITY_REVIEW.md) is historical engineering context, not a certification or guarantee of present security.
