# Failure Modes & Rollback Procedures

## agentics-diligence Service

This document defines common deployment failures, detection signals, and
rollback procedures for the agentics-diligence service.

---

## Common Deployment Failures

### 1. Container Build Failure

**Symptoms:**
- Cloud Build fails at `build-image` step
- Error messages about missing dependencies or syntax errors

**Detection Signals:**
- Cloud Build status: FAILURE
- Build logs show npm/node errors
- No new image pushed to Container Registry

**Resolution:**
```bash
# Check build logs
gcloud builds list --limit=1
gcloud builds log <BUILD_ID>

# Common fixes:
# 1. Fix package.json dependencies
# 2. Fix TypeScript compilation errors
# 3. Ensure all files are in .gcloudignore exclusions
```

---

### 2. Container Startup Failure

**Symptoms:**
- Deployment succeeds but revision crashes
- Health checks fail immediately
- "Container failed to start" error

**Detection Signals:**
- Cloud Run logs show startup errors
- Revision status: FAILED
- No traffic serving

**Resolution:**
```bash
# Check revision logs
gcloud run revisions list --service agentics-diligence --region us-central1
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.revision_name=<REVISION>"

# Common fixes:
# 1. Check PORT environment variable (must be 8080)
# 2. Verify all secrets are accessible
# 3. Check for missing environment variables
```

---

### 3. Secret Manager Access Failure

**Symptoms:**
- Service starts but agents fail
- "Secret not found" or "Permission denied" errors
- Learning endpoints return 500

**Detection Signals:**
- Logs show Secret Manager errors
- RUVECTOR_SERVICE_URL or other secrets undefined
- Telemetry shows configuration errors

**Resolution:**
```bash
# Verify secrets exist
gcloud secrets list

# Verify service account has access
gcloud secrets get-iam-policy ruvector-service-url

# Grant access if needed
gcloud secrets add-iam-policy-binding ruvector-service-url \
  --member="serviceAccount:diligence-service@agentics-dev.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 4. RuVector Service Connection Failure

**Symptoms:**
- Learning agents fail to persist
- DecisionEvents not stored
- 500 errors on POST endpoints

**Detection Signals:**
- Logs show "RuVector API error"
- Telemetry shows persistence failures
- Inspect endpoint returns empty results

**Resolution:**
```bash
# Check ruvector-service health
curl -s "$(gcloud secrets versions access latest --secret=ruvector-service-url)/health"

# Verify URL is correct
gcloud secrets versions access latest --secret=ruvector-service-url

# Check network connectivity (if VPC)
# Ensure Cloud Run is in same VPC or has VPC connector
```

---

### 5. Schema Validation Failures

**Symptoms:**
- Agents reject valid-looking input
- 400 errors with validation details
- Contract version mismatch

**Detection Signals:**
- Telemetry shows validation.error events
- Error details mention schema violations
- @agentics/contracts version mismatch

**Resolution:**
```bash
# Check installed contract version
npm ls @agentics/contracts

# Verify schema compatibility
node -e "console.log(require('@agentics/contracts').learning.v1)"

# If mismatch, rebuild with correct version
npm update @agentics/contracts
```

---

### 6. Memory/CPU Exhaustion

**Symptoms:**
- Service becomes unresponsive
- Requests timeout
- Container restarts frequently

**Detection Signals:**
- Cloud Run metrics show memory at limit
- Request latency spikes
- Container restart count increasing

**Resolution:**
```bash
# Check current resource usage
gcloud run services describe agentics-diligence --region us-central1 \
  --format 'yaml(spec.template.spec.containers[0].resources)'

# Increase resources if needed
gcloud run services update agentics-diligence --region us-central1 \
  --memory 1Gi \
  --cpu 2
```

---

### 7. Telemetry Endpoint Failure

**Symptoms:**
- No telemetry in LLM-Observatory
- Service works but no monitoring data
- Telemetry buffer grows indefinitely

**Detection Signals:**
- Observatory dashboard empty
- Service logs show telemetry errors
- Memory usage increases over time

**Resolution:**
```bash
# Check observatory URL
gcloud secrets versions access latest --secret=llm-observatory-url

# Disable telemetry temporarily if causing issues
gcloud run services update agentics-diligence --region us-central1 \
  --set-env-vars "LLM_OBSERVATORY_ENABLED=false"
```

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

Use this when the new revision is broken and traffic needs immediate restoration.

```bash
# 1. List revisions
gcloud run revisions list --service agentics-diligence --region us-central1

# 2. Get the previous working revision name
PREVIOUS_REVISION="agentics-diligence-00042-abc"

# 3. Route 100% traffic to previous revision
gcloud run services update-traffic agentics-diligence \
  --region us-central1 \
  --to-revisions "$PREVIOUS_REVISION=100"

# 4. Verify rollback
curl -s "$SERVICE_URL/" | jq .
```

### Gradual Rollback (Canary)

Use this for safer rollback when the issue is not immediately critical.

```bash
# 1. Split traffic 90/10 to old revision
gcloud run services update-traffic agentics-diligence \
  --region us-central1 \
  --to-revisions "PREVIOUS_REVISION=90,LATEST=10"

# 2. Monitor for 10 minutes

# 3. If issues persist, complete rollback
gcloud run services update-traffic agentics-diligence \
  --region us-central1 \
  --to-revisions "PREVIOUS_REVISION=100"
```

### Full Redeployment from Known Good State

Use this when multiple revisions are broken or state is unclear.

```bash
# 1. Checkout known good commit
git checkout <KNOWN_GOOD_COMMIT_SHA>

# 2. Deploy with explicit version tag
gcloud run deploy agentics-diligence \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --tag "rollback-$(date +%Y%m%d)"

# 3. Route traffic to rollback revision
gcloud run services update-traffic agentics-diligence \
  --region us-central1 \
  --to-tags "rollback-$(date +%Y%m%d)=100"
```

---

## Safe Redeploy Strategy (No Data Loss)

### Prerequisites

1. agentics-diligence is STATELESS - no data loss from container restarts
2. All persistence is via ruvector-service (external)
3. DecisionEvents are immutable once written

### Redeploy Steps

```bash
# 1. Verify current state
gcloud run services describe agentics-diligence --region us-central1

# 2. Check pending DecisionEvents (if any)
# Note: Service is stateless, but check ruvector for incomplete writes
curl -s "$(gcloud secrets versions access latest --secret=ruvector-service-url)/health"

# 3. Deploy new version
./scripts/deploy.sh prod

# 4. Verify new deployment
curl -s "$SERVICE_URL/v1/learn" | jq '.agents'

# 5. Run E2E verification
# (See POST_DEPLOY_VERIFICATION.md)
```

### Data Protection Guarantees

| Data Type | Protection | Recovery |
|-----------|------------|----------|
| DecisionEvents | Immutable in ruvector-service | Query ruvector-service |
| Diligence Docs | Read-only from filesystem | Included in container |
| Configuration | Environment variables | Re-apply via deployment |
| Secrets | Secret Manager | Persisted independently |

---

## Monitoring & Alerting

### Key Metrics to Watch

```bash
# Request latency
gcloud monitoring metrics list --filter="metric.type=run.googleapis.com/request_latencies"

# Error rate
gcloud monitoring metrics list --filter="metric.type=run.googleapis.com/request_count" | grep error

# Container restarts
gcloud run revisions describe <REVISION> --region us-central1 --format yaml | grep containerStatuses
```

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 1% | > 5% |
| P99 Latency | > 2s | > 5s |
| Memory Usage | > 70% | > 90% |
| Container Restarts | > 1/hour | > 5/hour |

---

## Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| On-Call Engineer | [TBD] | Immediate |
| Service Owner | [TBD] | 15 minutes |
| Platform Team | [TBD] | 30 minutes |

---

## Post-Incident Checklist

After resolving any deployment issue:

- [ ] Document root cause
- [ ] Update runbook if new failure mode
- [ ] Add monitoring for failure signal
- [ ] Create automated test to prevent recurrence
- [ ] Review and update deployment procedure if needed
