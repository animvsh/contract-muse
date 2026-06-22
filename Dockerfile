# syntax=docker/dockerfile:1.6

# ---- Build stage ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Copy lockfile + package.json first for better layer caching.
COPY package.json package-lock.json* ./

# Install deps. Skip postinstall scripts that require cloud-only env vars.
ENV CI=true
ENV HUSKY=0
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false
RUN npm install --include=dev --no-audit --no-fund

# Copy source and build.
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Copy only what's needed to run the built app.
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json* ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Run as non-root.
RUN useradd -m -u 1001 nodejs
USER nodejs

EXPOSE 8080

# TanStack Start server entry. TanStack Start 1.167+ emits the server bundle
# at dist/server/server.js (Nitro-style preset).
CMD ["node", "dist/server/server.js"]