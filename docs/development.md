# Development guide

## Prerequisites

- Node.js **22.12+** (`.nvmrc` pins the major version) and npm
- Docker with Compose v2 (PostgreSQL runs in a container)
- `make`, and optionally the draw.io desktop app and LaTeX for the docs

## First run

```bash
make setup    # npm ci, prisma generate, .env files, PostgreSQL, migrations
make dev      # API http://localhost:3000 + web http://localhost:5173
```

The database starts empty. `make seed` loads demo data (14 users, 8 communities with icons/banners, posts with
galleries, threaded comments, votes, friendships, chat). It **deletes all existing data**, so use it only locally.

## Useful scripts

| Command                           | What it does                                      |
| --------------------------------- | ------------------------------------------------- |
| `npm run dev`                     | API and web dev servers (concurrently)            |
| `npm run lint` / `lint:fix`       | ESLint (flat config)                              |
| `npm run format` / `format:check` | Prettier (with the Tailwind class sorter)         |
| `npm run typecheck`               | `tsc --noEmit` in every workspace                 |
| `npm test` / `test:coverage`      | Vitest in every workspace                         |
| `npm run build`                   | `tsup` (API) and `vite build` (web)               |
| `npm run db:* -w @ualgeddit/api`  | `generate`, `migrate`, `deploy`, `seed`, `studio` |

## Adding a feature (backend)

1. Add or extend the zod schema and DTO type in `packages/shared` (both apps will use it).
2. Repository: write the Prisma queries (`modules/<domain>/<domain>.repository.ts`).
3. Service: implement the business rules and throw `AppError` subclasses (`NotFoundError`, `ForbiddenError`…).
4. Controller: parse `req.params`/`req.query`/`req.body` with the shared schema, call the service, send the DTO.
5. Routes: register the endpoint with `requireAuth`/upload middleware as needed.
6. Wire new classes in `container.ts`, document the endpoint in `<domain>.docs.ts`, and add unit tests.

## Adding a feature (frontend)

1. Add the HTTP call to `features/<domain>/api.ts` and a TanStack Query hook to `hooks.ts`.
2. Build components with the primitives in `components/ui` and Tailwind tokens (`bg-surface`, `text-fg-muted`…).
3. Put every user-facing string in `src/i18n/locales/{en,pt,fr}.json` (the parity test fails if a key is missing).
4. Add a lazy route in `router.tsx` if it is a page.

## Testing

- **shared**: schema tests.
- **API**: services are tested with mocked repositories; the HTTP layer is tested with Supertest against the real
  Express app with stubbed services (no database needed); storage is tested on a temporary directory.
- **web**: Vitest + jsdom + Testing Library for components, hooks and utilities; i18n catalogue parity.

```bash
make test
npx vitest --root apps/web      # watch mode for one workspace
```

## Code style

- TypeScript `strict` with `noUncheckedIndexedAccess`; no `any` outside tests.
- Prettier formats everything (100 columns, single quotes); ESLint enforces correctness and React hooks rules.
- Code, comments, commit messages and documentation are written in **English**.

## Commit convention

The project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <description>

[optional body]

[optional footer, e.g. BREAKING CHANGE: …]
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `style`.
Scopes: `api`, `web`, `shared`, `auth`, `docker`, `deps`…

## Updating the ER diagram

Edit `docs/diagrams/er-diagram.drawio` with draw.io, then run `make erd` to regenerate the SVG and PNG.

## Building the report

```bash
make report   # needs a LaTeX distribution with latexmk
```
