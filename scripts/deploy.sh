#!/bin/bash
# agentics-diligence Deployment Script
#
# Deploys the unified diligence service to Google Cloud Run.
#
# Usage:
#   ./scripts/deploy.sh [environment]
#
# Environments:
#   dev      - Development (default)
#   staging  - Staging
#   prod     - Production
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - gcloud configured with correct project
#   - Required secrets created in Secret Manager

set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-agentics-dev}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
SERVICE_NAME="agentics-diligence"
ENVIRONMENT="${1:-dev}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
case "$ENVIRONMENT" in
    dev|staging|prod)
        log_info "Deploying to environment: $ENVIRONMENT"
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: dev, staging, prod"
        exit 1
        ;;
esac

# Verify gcloud authentication
log_info "Verifying gcloud authentication..."
if ! gcloud auth print-access-token &> /dev/null; then
    log_error "Not authenticated. Run: gcloud auth login"
    exit 1
fi

# Set project
log_info "Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Verify secrets exist
log_info "Verifying required secrets..."
REQUIRED_SECRETS=("ruvector-service-url" "ruvector-api-key" "llm-observatory-url")
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe "$secret" &> /dev/null; then
        log_warn "Secret '$secret' not found. Creating placeholder..."
        echo "placeholder" | gcloud secrets create "$secret" --data-file=- || true
    fi
done

# Build and deploy
log_info "Building and deploying $SERVICE_NAME..."

# Get current commit SHA for versioning
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION="1.0.0-${COMMIT_SHA}"

log_info "Version: $VERSION"

# Deploy using source (Cloud Build handles containerization)
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 60s \
    --concurrency 80 \
    --set-env-vars "SERVICE_NAME=$SERVICE_NAME,SERVICE_VERSION=$VERSION,PLATFORM_ENV=$ENVIRONMENT,LLM_OBSERVATORY_ENABLED=true,NODE_ENV=production" \
    --set-secrets "RUVECTOR_SERVICE_URL=ruvector-service-url:latest,RUVECTOR_API_KEY=ruvector-api-key:latest,LLM_OBSERVATORY_URL=llm-observatory-url:latest" \
    --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format 'value(status.url)')

log_info "Service deployed to: $SERVICE_URL"

# Run health checks
log_info "Running health checks..."

# Health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/")
if [ "$HEALTH_STATUS" = "200" ]; then
    log_info "Health check: PASSED"
else
    log_error "Health check: FAILED (status: $HEALTH_STATUS)"
    exit 1
fi

# API index endpoint
INDEX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/v1/diligence")
if [ "$INDEX_STATUS" = "200" ]; then
    log_info "API index check: PASSED"
else
    log_error "API index check: FAILED (status: $INDEX_STATUS)"
    exit 1
fi

# Print deployment summary
echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Service:      $SERVICE_NAME"
echo "Environment:  $ENVIRONMENT"
echo "Version:      $VERSION"
echo "Region:       $REGION"
echo "URL:          $SERVICE_URL"
echo ""
echo "Diligence Endpoints:"
echo "  - GET  $SERVICE_URL/"
echo "  - GET  $SERVICE_URL/v1/diligence"
echo "  - GET  $SERVICE_URL/v1/diligence/architecture"
echo "  - GET  $SERVICE_URL/v1/diligence/benchmarks"
echo "  - GET  $SERVICE_URL/v1/diligence/narratives"
echo "  - GET  $SERVICE_URL/v1/diligence/valuation"
echo ""
echo "CLI Commands (Documentation Generator Agent):"
echo "  - node src/cli.js generate --type <type> --audience <audience>"
echo "  - node src/cli.js inspect --artifact-id <id>"
echo "  - node src/cli.js templates"
echo ""
echo "Artifact Types: diligence_report, executive_summary, technical_assessment,"
echo "                risk_report, compliance_report, audit_package, governance_memo,"
echo "                investment_memo, architecture_overview, decision_log"
echo ""
log_info "Deployment successful!"
