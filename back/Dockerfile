# CrowdSense backend (NestJS) — production image
# Build:  docker build -t crowdy-backend ./back
# Run:    docker run -p 5000:5000 -e DATABASE_URL=postgres://... crowdy-backend

# ---------- base: Node + pnpm ----------
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

# ---------- build: all deps + compile TypeScript ----------
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---------- prod-deps: runtime dependencies only ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

# ---------- runtime: small image, non-root user ----------
FROM node:22-slim AS runtime
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
# Render sets PORT itself (main.ts reads process.env.PORT); 5000 is the local default.
EXPOSE 5000
CMD ["node", "dist/main.js"]
