# Security

This document summarises the security model of UAlgeddit and the findings of the security audit
performed in November 2026. To report a vulnerability, see [SECURITY.md](../SECURITY.md).

## Audit findings

| #   | Severity     | Area           | Finding                                                                                                         | Resolution                                                                                  |
| --- | ------------ | -------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **Critical** | Dependencies   | `npm audit`: 14 vulnerabilities (2 critical, 5 high), 5 in production dependencies (Prisma CLI chain, i18next). | Upgraded to Prisma 7, Vitest 5, i18next 27…; patched transitive versions pinned. Now **0**. |
| 2   | **High**     | Infrastructure | PostgreSQL published on every network interface with the default password `ualgeddit`.                          | Bound to `127.0.0.1`; password required and generated randomly by `make env`.               |
| 3   | **High**     | Privacy        | Uploaded photos kept their EXIF metadata, including **GPS location**.                                           | Every image is decoded and re-encoded to WebP with `sharp`, which strips all metadata.      |
| 4   | **High**     | Integrity      | Concurrent votes from the same user could be counted twice (read-then-write race), corrupting scores and karma. | Vote transactions lock the post/comment row (`SELECT … FOR UPDATE`).                        |
| 5   | Medium       | Uploads        | Pixel-flood images and polyglot files passed the magic-byte check.                                              | 40 MP decode limit, re-encoding drops embedded payloads, dimensions bounded per use.        |
| 6   | Medium       | Auth           | Login brute force was only limited per IP (distributed attacks on one account were not slowed down).            | Failed logins limited per account (10 / 15 min) in addition to per IP.                      |
| 7   | Medium       | Abuse          | No per-user limit on writes (votes, posts, comments, friend requests).                                          | 60 state-changing requests per minute per user.                                             |
| 8   | Medium       | Sessions       | Chat WebSockets stayed authenticated after logout; unlimited sockets per user.                                  | Sessions re-validated on every heartbeat (closed with 4401); max 5 sockets per user.        |
| 9   | Medium       | Integrity      | Usernames were unique case-sensitively in the database ("Alice" and "alice" could both register concurrently).  | Unique `username_lower` column.                                                             |
| 10  | Medium       | Auth           | Passwords were limited to 72 characters, but bcrypt truncates at 72 **bytes**.                                  | Limit enforced in UTF-8 bytes.                                                              |
| 11  | Low          | Containers     | Containers ran with default capabilities and writable root filesystems.                                         | `cap_drop: ALL`, read-only root filesystems, `no-new-privileges`, memory/PID limits.        |
| 12  | Low          | Web            | Post-login redirect target was not validated.                                                                   | Only internal paths are accepted.                                                           |
| 13  | Low          | Cookies        | Under HTTPS, the session cookie could be shadowed by a sibling subdomain.                                       | `__Host-` cookie prefix when `COOKIE_SECURE=true`.                                          |
| 14  | Low          | Availability   | Unbounded page numbers and comment trees allowed expensive queries.                                             | Page ≤ 500, at most 2000 comments loaded per post.                                          |
| 15  | Low          | Correctness    | `%`/`_` in search matched everything; valid long posts were rejected (multipart/JSON limits).                   | LIKE wildcards escaped; body limits sized to the longest valid post.                        |
| 16  | Info         | Process        | No static analysis or vulnerability gate in CI.                                                                 | CodeQL, `npm audit --audit-level=high`, dependency review on PRs.                           |

## Security controls

### Authentication and sessions

- Passwords hashed with bcrypt (cost 12); 8–72 UTF-8 bytes with letters and numbers.
- The session JWT (HS256, issuer/audience pinned) lives **only** in an `httpOnly`, `SameSite=Lax` cookie,
  `Secure` and `__Host-` prefixed under HTTPS. It is never returned in a body and `Authorization` headers are
  ignored.
- Every token carries the user's `token_version`; logout and password changes increment it, revoking every
  session immediately (REST and WebSocket).
- Login is constant-work with a generic error (no user enumeration) and is rate limited per IP and per account.
- Changing the password or deleting the account requires the current password.

### Requests

- Every input is validated with zod schemas shared with the client.
- CORS allow-list with credentials; state-changing requests from foreign `Origin`s are rejected (CSRF defence
  in depth on top of `SameSite`).
- Rate limits: 600 req/min per IP globally, 30 auth requests per 15 min per IP, 10 failed logins per 15 min per
  account, 60 writes/min per user, 5 chat messages per 5 s per socket.
- Body limits: JSON 256 kB, images 5 MiB (10 per post, 4 per comment).
- Errors never leak stack traces; logs redact cookies and authorization headers.

### Uploads

1. MIME allow-list (JPEG, PNG, GIF, WebP) and size/count limits (multer, in memory).
2. Real type detected from magic bytes; SVG/HTML rejected.
3. Decoded and re-encoded to WebP with a 40 MP limit: metadata stripped, orientation applied, dimensions bounded.
4. Stored under random UUID names; only names generated by the server can be deleted (no path traversal).
5. Served with `Content-Security-Policy: default-src 'none'; sandbox`, `nosniff` and long caching.

### Browser

- Strict CSP on the SPA (no inline scripts), `X-Frame-Options: DENY`, `frame-ancestors 'none'`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`.
- React escapes all user content; no `dangerouslySetInnerHTML`.
- Post-login redirects are restricted to internal paths.

### Data

- Prisma parameterised queries; the few raw queries use tagged templates (bound parameters).
- Integrity constraints (`CHECK`, unique and foreign keys) in the database itself.
- Denormalised counters are maintained in transactions with row locks.
- Account deletion removes all owned content and uploads, and repairs the counters of other users.

### Infrastructure

- Non-root containers, read-only root filesystems, all capabilities dropped, `no-new-privileges`,
  memory/PID limits.
- PostgreSQL only reachable from the host's loopback interface; secrets generated by `make env` and stored in
  `0600` files that are git-ignored.
- Swagger UI disabled in production.
- CI: CodeQL, dependency audit gate, dependency review, Dependabot.

## Recommendations for production

- Serve over HTTPS, set `COOKIE_SECURE=true` and enable HSTS (commented line in `apps/web/nginx.conf`).
- Enable GitHub private vulnerability reporting and secret scanning on the repository.
- Keep `JWT_SECRET` and `POSTGRES_PASSWORD` in a secret manager; rotate `JWT_SECRET` to revoke all sessions.
- Back up the `pgdata` and `uploads` volumes and test restores.
