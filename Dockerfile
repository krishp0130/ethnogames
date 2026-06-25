# Production image: build Next.js, run custom server + Socket.IO.
# Only runtime files are copied into the final stage.

FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY server.ts next.config.ts ./
COPY server ./server
COPY src/types ./src/types

EXPOSE 3000
CMD ["npm", "run", "start"]
