# ─────────────────────────────────────────────────────────────
# Stage 1: Build frontend (Vite + React + TypeScript)
# ─────────────────────────────────────────────────────────────
FROM docker.das-security.cn/node:22-alpine AS frontend-build
WORKDIR /frontend

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx vite build
# output: /frontend/dist


# ─────────────────────────────────────────────────────────────
# Stage 2: Build backend (TypeScript → JS)
# ─────────────────────────────────────────────────────────────
FROM docker.das-security.cn/node:22-alpine AS backend-build
WORKDIR /backend

COPY server/package.json server/package-lock.json* ./
RUN npm ci

COPY server/ .
RUN npx prisma generate
RUN npm run build
# output: /backend/dist


# ─────────────────────────────────────────────────────────────
# Stage 3: Production image
# ─────────────────────────────────────────────────────────────
FROM docker.das-security.cn/node:22-alpine AS runner

# Mirror source layout so path.join(__dirname, '../../dist') works:
# __dirname = /workspace/server/dist → ../../dist = /workspace/dist
WORKDIR /workspace/server

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

# Backend compiled JS
COPY --from=backend-build /backend/dist ./dist

# Prisma client
COPY --from=backend-build /backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /backend/node_modules/@prisma ./node_modules/@prisma

# Prisma schema
COPY server/prisma ./prisma

# Frontend build output → matches path.join(__dirname, '../../dist')
COPY --from=frontend-build /frontend/dist /workspace/dist

EXPOSE 3002

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
