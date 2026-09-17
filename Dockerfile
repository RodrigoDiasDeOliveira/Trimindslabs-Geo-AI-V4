# Multi-stage Dockerfile for Triminds Geo-AI V4 (Node.js + Express + Vite SPA)
# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for vite & esbuild)
RUN npm install

# Copy application source code
COPY . .

# Build Vite client SPA (dist/index.html & dist/assets/*) and bundle backend (dist/server.cjs)
RUN npm run build

# 2. Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and bundled server from builder stage
COPY --from=builder /app/dist ./dist

# Expose Cloud Run port (8080) and local dev port (3000)
ENV PORT=8080
EXPOSE 8080
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
