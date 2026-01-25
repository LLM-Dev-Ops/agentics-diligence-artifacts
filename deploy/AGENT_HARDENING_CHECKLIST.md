# Document Agent Hardening Checklist

## Repository: agentics-diligence-artifacts
## Agent: Documentation Generator Agent
## Version: 1.1.0 (Hardened)
## Target: Google Cloud Run

---

## Pre-Deployment Checklist

### Role Rules Enforcement

- [x] Agent MAY read DecisionEvents
- [x] Agent MAY format executive documents
- [x] Agent MUST NOT generate new analysis (pattern enforcement added)
- [x] Agent MUST NOT emit policy or risk conclusions (pattern enforcement added)
- [x] Role constraint validation implemented in `_enforceRoleConstraints()`

### DecisionEvent Rules

- [x] Emits ONLY `document_generation_signal` (changed from `documentation_generation`)
- [x] Includes `referenced_event_ids` (array of consumed event IDs, max 100)
- [x] Includes `confidence_passthrough` (aggregated from source events, not generated)
- [x] Schema updated: `contracts/documentation/v1/decision-event.schema.json`

### Performance Budgets

- [x] MAX_TOKENS = 2000 (enforced with truncation)
- [x] MAX_LATENCY_MS = 4000 (enforced with warning)
- [x] Latency guard timer implemented
- [x] Token estimation and truncation logic added

### Infrastructure Requirements

- [x] RuVector service dependency configured
- [x] Secrets in Google Secret Manager:
  - `ruvector-service-url`
  - `ruvector-api-key`
  - `llm-observatory-url`
- [x] Cloud Run deployment configuration ready
- [x] Non-root container user (security)
- [x] Health checks configured

### Contract Updates

- [x] `decision_type` changed to `document_generation_signal`
- [x] `agent_version` bumped to `1.1.0`
- [x] `referenced_event_ids` added to outputs (required)
- [x] `confidence_passthrough` added to outputs (nullable)

---

## Hardened Agent Constraints

```
ROLE_CONSTRAINTS = {
  ALLOWED_OPERATIONS: ['read_decision_events', 'format_executive_documents'],
  PROHIBITED_PATTERNS: [
    /recommend.*policy|strategy|action|decision/i,
    /analysis.*risk|threat|vulnerability/i,
    /we believe|recommend|conclude|assess/i,
    /should proceed|invest|divest|approve|reject/i
  ]
}
```

---

## Deploy Command

```bash
# Trigger Cloud Build deployment
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=YOUR_PROJECT_ID \
  --substitutions=_SERVICE_NAME=agentics-diligence,_REGION=us-central1,_PLATFORM_ENV=prod

# Or deploy directly to Cloud Run
gcloud run deploy agentics-diligence \
  --image gcr.io/YOUR_PROJECT_ID/agentics-diligence:latest \
  --region us-central1 \
  --platform managed \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60s \
  --concurrency 80 \
  --set-env-vars "SERVICE_NAME=agentics-diligence,PLATFORM_ENV=prod,LLM_OBSERVATORY_ENABLED=true" \
  --set-secrets "RUVECTOR_SERVICE_URL=ruvector-service-url:latest,RUVECTOR_API_KEY=ruvector-api-key:latest,LLM_OBSERVATORY_URL=llm-observatory-url:latest"
```

---

## Post-Deployment Verification

```bash
# 1. Health check
curl -s https://YOUR_SERVICE_URL/ | jq

# 2. API index check
curl -s https://YOUR_SERVICE_URL/v1/diligence | jq

# 3. Verify agent version
curl -s https://YOUR_SERVICE_URL/v1/diligence | jq '.agent_version'
# Expected: "1.1.0"

# 4. Test document generation (should emit document_generation_signal)
curl -X POST https://YOUR_SERVICE_URL/v1/diligence/generate \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "test-request-001",
    "artifact_type": "executive_summary",
    "audience": "executive"
  }' | jq '.decisionEvent.decision_type'
# Expected: "document_generation_signal"

# 5. Verify referenced_event_ids in output
curl -X POST https://YOUR_SERVICE_URL/v1/diligence/generate \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "test-request-002",
    "artifact_type": "executive_summary",
    "audience": "executive"
  }' | jq '.decisionEvent.outputs.referenced_event_ids'
# Expected: array of event IDs
```

---

## Rollback Procedure

If issues are detected post-deployment:

```bash
# List revisions
gcloud run revisions list --service agentics-diligence --region us-central1

# Rollback to previous revision
gcloud run services update-traffic agentics-diligence \
  --region us-central1 \
  --to-revisions PREVIOUS_REVISION=100
```

---

## Security Notes

1. **No analysis generation**: Agent only formats existing DecisionEvents
2. **No policy emission**: Content is validated against prohibited patterns
3. **Confidence passthrough**: Confidence values are passed through, not generated
4. **Token limit**: Output capped at 2000 tokens to prevent runaway generation
5. **Latency budget**: 4000ms max to prevent resource exhaustion
6. **Secret Manager**: All credentials managed externally

---

## Files Modified

- `src/agents/documentation-generator-agent.js` - Main agent hardening
- `contracts/documentation/v1/decision-event.schema.json` - Schema updates

## Hardening Date

$(date -u +"%Y-%m-%dT%H:%M:%SZ")
