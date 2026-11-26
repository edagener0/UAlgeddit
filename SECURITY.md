# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report them privately through
[GitHub private vulnerability reporting](https://github.com/edagener0/UAlgeddit/security/advisories/new)
with a description, the affected version/commit and, if possible, steps to reproduce.
You will receive an acknowledgement within a few days, and a fix will be released as soon as possible.

## Supported versions

Only the latest version on the `main` branch receives security fixes.

## Security measures

An overview of the protections built into UAlgeddit (session handling, rate limiting, upload
sanitisation, container hardening…) is documented in [docs/security.md](docs/security.md).
Automated checks run on every change: CodeQL static analysis, `npm audit`, dependency review on pull
requests and Dependabot updates.
