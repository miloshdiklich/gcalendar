# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Install deps and generate Prisma client in the SAME layer that owns node_modules
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
RUN npx prisma generate

# Build TS
FROM deps AS builder
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# Runtime
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache netcat-openbsd
ENV NODE_ENV=production
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# ⬇️ Copy node_modules from *builder* (inherits deps where we generated client)
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
CMD ["./docker-entrypoint.sh"]
