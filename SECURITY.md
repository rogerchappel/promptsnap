# Security Policy

promptsnap is a local-first developer tool. It does not call hosted LLMs, send telemetry, or upload prompt content.

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.x | Yes |

## Reporting a Vulnerability

Please report vulnerabilities through GitHub private vulnerability reporting on `rogerchappel/promptsnap`, or open a minimal public issue if the report does not expose sensitive details.

Useful reports include:

- Redaction bypasses that can leak common secrets into snapshots.
- Path traversal or unsafe file write behavior.
- Unexpected network access at runtime.
- Supply-chain or packaging issues.

Do not include real secrets in reports. Use synthetic examples whenever possible.
