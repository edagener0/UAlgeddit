# syntax=docker/dockerfile:1.7
# Build context: repository root (the API depends on the shared workspace package).

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

# ---- Install every dependency (including dev) for the build -------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,target=/root/.npm npm ci -w @ualgeddit/api

# ---- Compile ---------------------------------------------------------------
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run db:generate -w @ualgeddit/api && npm run build -w @ualgeddit/api

# ---- Production image --------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    API_PORT=3000 \
    UPLOAD_DIR=uploads
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,target=/root/.npm npm ci -w @ualgeddit/api --omit=dev

WORKDIR /app/apps/api
COPY apps/api/prisma ./prisma
COPY apps/api/prisma.config.ts ./
RUN /app/node_modules/.bin/prisma generate
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p uploads && chown -R node:node uploads
USER node

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${API_PORT}/api/health" > /dev/null || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
