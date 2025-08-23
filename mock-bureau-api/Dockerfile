# Use the latest LTS Node.js with Alpine for security and efficiency
FROM node:20-alpine3.19

# Install security updates and essential packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init wget && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps for building)
RUN npm ci && \
    npm cache clean --force

# Copy application code
COPY . .

# Build the application
RUN npm run build && \
    npm prune --production

# Remove source files to reduce image size
RUN rm -rf src/ *.md .git* .gitignore

# Set proper permissions
RUN chown -R appuser:appgroup .

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check using the application's health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
