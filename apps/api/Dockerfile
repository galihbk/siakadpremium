FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# ------------------------------------------------------------------------------
# Stage 1: Install dependencies and build
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy root manifests & workspace configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json                 ./apps/api/package.json
COPY packages/database/package.json        ./packages/database/package.json
COPY packages/types/package.json           ./packages/types/package.json
COPY packages/utils/package.json           ./packages/utils/package.json
COPY packages/auth/package.json            ./packages/auth/package.json
COPY packages/ui/package.json              ./packages/ui/package.json
COPY packages/config/package.json          ./packages/config/package.json
COPY packages/eslint-config/package.json   ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Generate Prisma Client & build workspace packages
RUN pnpm --filter @siakad/database db:generate
RUN pnpm --filter @siakad/types build
RUN pnpm --filter @siakad/utils build
RUN pnpm --filter @siakad/auth build
RUN pnpm --filter @siakad/database build
RUN pnpm --filter @siakad/api build

# Switch to non-hoisted mode for deploy to avoid symlink conflict
RUN echo "shamefully-hoist=false\nauto-install-peers=true\nforce-legacy-deploy=true" > .npmrc
RUN pnpm --filter=@siakad/api deploy --legacy --prod /standalone

# Generate Prisma Client in standalone directory for production
RUN cp -r packages/database/prisma /standalone/prisma
RUN cd /standalone && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" /app/node_modules/.bin/prisma generate --schema=/standalone/prisma/schema.prisma

# ------------------------------------------------------------------------------
# Stage 2: Lean production image
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy flat node_modules from pnpm deploy
COPY --from=builder /standalone/node_modules ./node_modules
COPY --from=builder /standalone/package.json ./package.json

# Copy built app and database schema
COPY --from=builder /app/apps/api/dist               ./dist
COPY --from=builder /standalone/prisma              ./prisma

RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "dist/main.js"]

