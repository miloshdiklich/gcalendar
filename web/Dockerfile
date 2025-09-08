# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
# Copy lockfile first for better layer caching
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
# Vite/TS config + source
COPY index.html ./index.html
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY src ./src

# Provide API URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build static assets
RUN pnpm build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine AS runner
# Simple SPA config: serve index.html for unknown routes
RUN printf 'server { \
  listen 8080; \
  server_name _; \
  root /usr/share/nginx/html; \
  location / { try_files $uri /index.html; } \
}\n' > /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
# nginx base image already uses: CMD ["nginx", "-g", "daemon off;"]
