# Multi-stage build for optimal image size

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install typescript @types/node --save-dev

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start application
CMD ["node", "dist/app.js"]
