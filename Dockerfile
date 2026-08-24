FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json .

COPY package-lock.json .

RUN npm ci

COPY app/ ./app/
COPY public/ ./public/
COPY proxy.ts ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY eslint.config.mjs ./

RUN npm run build

FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

EXPOSE 3000

USER appuser:appgroup

ENTRYPOINT ["node", "server.js"]