# Contributing to UAlgeddit

Thanks for taking the time to contribute!

## Workflow

1. Fork the repository and create a branch from `main` (`feat/gallery-captions`, `fix/vote-race`…).
2. Set up the project with `make setup` and run it with `make dev` (see [docs/development.md](docs/development.md)).
3. Make your change with tests, and add translations for any new text (`apps/web/src/i18n/locales`).
4. Run `make ci` (format, lint, typecheck, tests, build) and make sure it passes.
5. Open a pull request describing **what** changed and **why**. CI must be green before merging.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(web): add captions to gallery images
fix(api): prevent double counting of concurrent votes
docs: explain the hot ranking formula
```

Mark breaking changes with `!` after the type/scope and a `BREAKING CHANGE:` footer.

## Guidelines

- Keep the backend layering: routes → controller → service → repository.
- Validate every input with a zod schema from `packages/shared`.
- Write code, comments and documentation in English.
- Never commit secrets: `.env` files are git-ignored; use the `.env.example` files.
- Report security issues privately to the maintainers instead of opening a public issue.
