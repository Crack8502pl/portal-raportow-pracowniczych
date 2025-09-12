# Portal Raportów Pracowniczych - Docker Configuration
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY server/ ./
COPY client/ ./public/

# Create upload and export directories
RUN mkdir -p uploads exports

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]