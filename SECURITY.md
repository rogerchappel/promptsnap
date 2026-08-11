# Security Policy

promptsnap is a local-first developer tool. It does not call hosted LLMs, send telemetry, or upload prompt content.

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.x | Yes |

## Reporting a Vulnerability

Please email vulnerability reports to `miscanalysis@gmail.com`. Do not include
sensitive details, exploit instructions, or real secrets in a public GitHub
issue. You may open a minimal public issue asking for private follow-up if it
does not reveal the vulnerability.

Useful reports include:

- Redaction bypasses that can leak common secrets into snapshots.
- Path traversal or unsafe file write behavior.
- Unexpected network access at runtime.
- Supply-chain or packaging issues.

Do not include real secrets in reports. Use synthetic examples whenever possible.
