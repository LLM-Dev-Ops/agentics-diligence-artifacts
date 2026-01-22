# agentics-diligence-artifacts
# Unified Diligence Learning Service
#
# This Dockerfile builds the production container for the
# agentics-diligence service deployed to Google Cloud Run.
#
# ARCHITECTURAL CONSTRAINTS:
# - Stateless runtime
# - No direct database connections
# - All persistence via ruvector-service
# - Single unified service for all agents

FROM node:20-slim AS base

# Install production dependencies only
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY contracts/ ./contracts/
COPY src/ ./src/
COPY synthesis/dist/ ./synthesis/dist/

# Copy diligence documentation directories
COPY architecture/ ./architecture/
COPY benchmarks/ ./benchmarks/
COPY narratives/ ./narratives/
COPY valuation/ ./valuation/

# Build stage for synthesis TypeScript (if needed)
FROM base AS builder

RUN npm ci
COPY synthesis/ ./synthesis/
RUN npm run build:synthesis || true

# Production image
FROM node:20-slim AS production

# Security: Run as non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Copy from base (production deps only)
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/contracts ./contracts
COPY --from=base /app/src ./src

# Copy diligence documentation directories
COPY --from=base /app/architecture ./architecture
COPY --from=base /app/benchmarks ./benchmarks
COPY --from=base /app/narratives ./narratives
COPY --from=base /app/valuation ./valuation

# Copy compiled synthesis if exists
COPY --from=builder /app/synthesis/dist ./synthesis/dist

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Environment defaults
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 8080

# Start the unified service
CMD ["node", "src/server.js"]
