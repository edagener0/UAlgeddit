# Deployment

The production stack is defined in [`docker-compose.yml`](../docker-compose.yml):

| Service | Image                            | Notes                                                           |
| ------- | -------------------------------- | --------------------------------------------------------------- |
| `db`    | `postgres:17-alpine`             | Data in the `pgdata` volume, health-checked                     |
| `api`   | built from `apps/api/Dockerfile` | Runs `prisma migrate deploy` on start, non-root, health-checked |
| `web`   | built from `apps/web/Dockerfile` | Unprivileged nginx: static SPA + reverse proxy on port 8080     |

Containers run as non-root users with read-only root filesystems, no Linux capabilities, `no-new-privileges`
and memory/PID limits. Start-up order is enforced with health checks: `db` → `api` → `web`. Uploaded images are kept in the `uploads` volume.

```bash
make up      # build and start (creates .env with a random JWT secret on first run)
make logs    # follow logs
make down    # stop (volumes are kept)
```

## Images

- **API**: multi-stage build. Dependencies are installed with `npm ci` (BuildKit cache), the code is bundled with
  `tsup`, and the runtime stage only contains production dependencies, the Prisma client and `dist/`. It runs as the
  `node` user.
- **Web**: Vite builds the static bundle, served by `nginxinc/nginx-unprivileged` with gzip, immutable caching for
  fingerprinted assets, SPA fallback and security headers (strict CSP, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`).

## Production checklist

- [ ] Run `make env` (random `JWT_SECRET` and `POSTGRES_PASSWORD`, files with `0600` permissions).
- [ ] Serve the site over **HTTPS** (for example a TLS-terminating proxy or load balancer in front of `web`) and set
      `COOKIE_SECURE=true` (the cookie then uses the `__Host-` prefix); enable HSTS in `apps/web/nginx.conf`.
- [ ] Set `PUBLIC_URL` to the public origin (it becomes the CORS / WebSocket allow-list).
- [ ] Use a strong, private `JWT_SECRET` (`openssl rand -base64 48`) and strong PostgreSQL credentials.
- [ ] PostgreSQL is only published on `127.0.0.1`; remove the `ports` entry entirely if no host tool needs it.
- [ ] Adjust `TRUST_PROXY` to the number of proxies in front of the API so rate limiting sees real client IPs.
- [ ] Back up the `pgdata` and `uploads` volumes.
- [ ] Keep `API_DOCS_ENABLED` unset or `false` (Swagger UI is disabled in production by default).
- [ ] Never run the seed against production (it refuses unless `SEED_FORCE=true`).
