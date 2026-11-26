# UAlgeddit task runner. Run `make` or `make help` to list every target.

SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE := docker compose
API := npm run --workspace @ualgeddit/api
WEB := npm run --workspace @ualgeddit/web

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 } \
		/^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Setup

.PHONY: env
env: ## Create .env files from the examples (with a random JWT secret)
	@if [ ! -f .env ]; then \
		sed "s|^JWT_SECRET=.*|JWT_SECRET=$$(openssl rand -base64 48 | tr -d '\n/+=')|" .env.example > .env; \
		echo "Created .env"; \
	fi
	@if [ ! -f apps/api/.env ]; then \
		sed "s|^JWT_SECRET=.*|JWT_SECRET=$$(openssl rand -base64 48 | tr -d '\n/+=')|" apps/api/.env.example > apps/api/.env; \
		echo "Created apps/api/.env"; \
	fi

.PHONY: install
install: env ## Install dependencies and generate the Prisma client
	npm ci
	$(API) db:generate

.PHONY: setup
setup: install db-up migrate seed ## One-shot local setup: install, start Postgres, migrate and seed

##@ Development

.PHONY: dev
dev: env db-up ## Start Postgres, then the API and web dev servers with hot reload
	npm run dev

.PHONY: dev-api
dev-api: env db-up ## Start only the API dev server
	$(API) dev

.PHONY: dev-web
dev-web: ## Start only the web dev server
	$(WEB) dev

##@ Database

.PHONY: db-up
db-up: ## Start the PostgreSQL container
	$(COMPOSE) up -d --wait db

.PHONY: db-down
db-down: ## Stop the PostgreSQL container
	$(COMPOSE) stop db

.PHONY: migrate
migrate: ## Create/apply migrations in development (prisma migrate dev)
	$(API) db:migrate

.PHONY: migrate-deploy
migrate-deploy: ## Apply pending migrations (prisma migrate deploy)
	$(API) db:deploy

.PHONY: seed
seed: ## Reset the data and populate the database with mock data
	$(API) db:seed

.PHONY: db-reset
db-reset: ## Drop the database, re-apply every migration and seed
	$(API) db:reset

.PHONY: studio
studio: ## Open Prisma Studio
	$(API) db:studio

##@ Quality

.PHONY: format
format: ## Format every file with Prettier
	npm run format

.PHONY: format-check
format-check: ## Check formatting
	npm run format:check

.PHONY: lint
lint: ## Lint with ESLint
	npm run lint

.PHONY: typecheck
typecheck: ## Type-check every workspace
	npm run typecheck

.PHONY: test
test: ## Run every unit test suite
	npm test

.PHONY: coverage
coverage: ## Run the tests with coverage reports
	npm run test:coverage

.PHONY: ci
ci: format-check lint typecheck test build ## Run the same checks as CI

.PHONY: build
build: ## Build the API and the web client
	npm run build

##@ Docker

.PHONY: up
up: env ## Build and start the full stack on http://localhost:8080
	$(COMPOSE) up -d --build --wait
	@echo "UAlgeddit is running on http://localhost:$${WEB_PORT:-8080} (API docs: /api/docs)"

.PHONY: up-seed
up-seed: up ## Start the full stack and load the mock data
	$(COMPOSE) exec -e SEED_FORCE=true api node dist/seed.js

.PHONY: down
down: ## Stop the stack (keeps data)
	$(COMPOSE) down

.PHONY: logs
logs: ## Follow the logs of every service
	$(COMPOSE) logs -f

.PHONY: ps
ps: ## Show the status of the containers
	$(COMPOSE) ps

.PHONY: docker-seed
docker-seed: ## Load mock data into the running Docker stack
	$(COMPOSE) exec -e SEED_FORCE=true api node dist/seed.js

##@ Documentation

.PHONY: erd
erd: ## Export the draw.io ER diagram to SVG and PNG
	drawio --export --format svg --embed-diagram --output docs/diagrams/er-diagram.svg docs/diagrams/er-diagram.drawio
	drawio --export --format png --scale 2 --output docs/diagrams/er-diagram.png docs/diagrams/er-diagram.drawio

.PHONY: report
report: ## Build the project report PDF (requires LaTeX)
	cd docs/report && latexmk -pdf -interaction=nonstopmode report.tex && latexmk -c

##@ Cleanup

.PHONY: clean
clean: ## Remove build output and coverage
	rm -rf apps/*/dist apps/*/coverage packages/*/coverage

.PHONY: nuke
nuke: clean ## Remove node_modules and every Docker volume (DELETES DATA)
	$(COMPOSE) down -v
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
