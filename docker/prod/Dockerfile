# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app

ENV CI=true

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm deploy --filter . --prod --legacy /prod/app

# Stage 2: Runner
FROM node:24-alpine AS runner
WORKDIR /app

USER node

COPY --from=builder --chown=node:node /prod/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/be.infra.umss.net ./be.infra.umss.net
COPY --from=builder --chown=node:node /app/package.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "be.infra.umss.net/src/main.js"]
