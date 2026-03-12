FROM node:24-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Deps
FROM base AS deps
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY prisma ./prisma
RUN npx prisma generate

# Build
FROM deps AS build
COPY . .
RUN npm run build

# Prod
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY package.json ./
COPY prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]