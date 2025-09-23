# Backend Dockerfile - Optimized for Production
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies for building
COPY package*.json ./
RUN npm ci --only=development && npm cache clean --force

# Copy source code and build
COPY . .
RUN npm run build

FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application and necessary files
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/knexfile.js ./
COPY --from=builder --chown=backend:nodejs /app/src/migrations ./src/migrations
COPY --from=builder --chown=backend:nodejs /app/src/seeds ./src/seeds

# Switch to non-root user
USER backend

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]