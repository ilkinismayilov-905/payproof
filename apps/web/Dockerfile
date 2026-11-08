# Web image (I-01) — build from the repo root: docker compose build web
# A production build against the real API. NEXT_PUBLIC_* values are baked in at build time, so
# NEXT_PUBLIC_API_URL is the address the *browser* uses (not a compose-internal host name).
FROM node:22-slim AS build
ENV NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
# dependencies first: this layer is reused until a manifest or the lockfile changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/mocks/package.json packages/mocks/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter "web..."
COPY packages/ packages/
COPY fixtures/ fixtures/
COPY apps/web/ apps/web/
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
# demo file picker on the real API: the mock extraction adapter recognises them by name
ARG NEXT_PUBLIC_DEMO_FILES=1
ENV NEXT_PUBLIC_API_MOCK=0 \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_DEMO_FILES=$NEXT_PUBLIC_DEMO_FILES
RUN pnpm --filter web build

FROM build AS web
ENV NODE_ENV=production
WORKDIR /app/apps/web
USER node
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=30 \
    CMD node -e "fetch('http://127.0.0.1:3000/login').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["./node_modules/.bin/next", "start", "-p", "3000"]
