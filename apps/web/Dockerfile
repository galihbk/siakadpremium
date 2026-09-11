FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# ------------------------------------------------------------------------------
# Stage 1: Build Next.js Web
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json                 ./apps/web/package.json
COPY packages/database/package.json        ./packages/database/package.json
COPY packages/types/package.json           ./packages/types/package.json
COPY packages/utils/package.json           ./packages/utils/package.json
COPY packages/auth/package.json            ./packages/auth/package.json
COPY packages/ui/package.json              ./packages/ui/package.json
COPY packages/config/package.json          ./packages/config/package.json
COPY packages/eslint-config/package.json   ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN mkdir -p apps/web/public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm --filter @siakad/database db:generate
RUN pnpm --filter @siakad/web build

# ------------------------------------------------------------------------------
# Stage 2: Lean production image
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/web/public           ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static     ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
