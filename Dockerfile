# ==============================================================================
# ShopHub - Future-Ready Multi-Stage Dockerfile (Next.js 16 + Node 20 Alpine)
# Optimized for ultra-light footprint, security hardening (non-root), and speed
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Alpine Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# for why libc6-compat might be needed for Alpine.
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Dependencies Installation
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install exact dependencies with caching layer
RUN npm ci --legacy-peer-deps

# ------------------------------------------------------------------------------
# Stage 3: Build Application
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1

# Build Next.js application (generates .next/standalone via next.config.js)
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production Runner (Hardened, Minimal, Non-Root)
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static public assets
COPY --from=builder /app/public ./public

# Set up permissions for Next.js image optimization cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone production build and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose standard web port
EXPOSE 3000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/faqs || exit 1

# Start Next.js standalone server
CMD ["node", "server.js"]
