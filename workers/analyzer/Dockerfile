FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first (for caching)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY workers/analyzer/package.json workers/analyzer/package.json
COPY packages packages

# Install root dependencies
RUN npm install

# Ensure Prisma dependencies exist in API workspace
RUN npm install prisma@6 @prisma/client@6 --workspace=apps/api

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build worker
RUN npm run build --workspace=apps/api
RUN npm run build --workspace=workers/analyzer

CMD ["node", "workers/analyzer/dist/index.js"]