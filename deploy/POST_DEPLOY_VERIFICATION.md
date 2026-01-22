# Post-Deployment Verification Checklist

## agentics-diligence Service

This checklist verifies the agentics-diligence service is fully operational
after deployment to Google Cloud Run.

---

## Pre-Verification Requirements

```bash
# Set service URL
export SERVICE_URL="https://agentics-diligence-1062287243982.us-central1.run.app"

# Or get dynamically
export SERVICE_URL=$(gcloud run services describe agentics-diligence \
  --region us-central1 \
  --format 'value(status.url)')
```

---

## 1. Service Health Verification

### 1.1 Health Check Endpoint

```bash
# Test: Health endpoint responds with 200
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/"
# Expected: 200

# Verify response structure
curl -s "$SERVICE_URL/" | jq '{status, service, execution_id}'
# Expected: {"status":"healthy","service":"agentics-diligence","execution_id":"..."}
```

- [ ] Health endpoint returns 200
- [ ] Response includes `status: healthy`
- [ ] Response includes `execution_id`

### 1.2 API Index Endpoint

```bash
# Test: API index responds
curl -s "$SERVICE_URL/v1/diligence" | jq '.service, .version'
# Expected: "agentics-diligence" "1.0.0"
```

- [ ] API index returns 200
- [ ] Response includes service name and version

---

## 2. Documentation Endpoints Verification

### 2.1 Architecture Endpoint

```bash
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/v1/diligence/architecture"
# Expected: 200
```

- [ ] Architecture endpoint returns 200
- [ ] Response includes `files` array
- [ ] Response includes `execution_id`

### 2.2 Benchmarks Endpoint

```bash
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/v1/diligence/benchmarks"
# Expected: 200
```

- [ ] Benchmarks endpoint returns 200

### 2.3 Narratives Endpoint

```bash
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/v1/diligence/narratives"
# Expected: 200
```

- [ ] Narratives endpoint returns 200

### 2.4 Valuation Endpoint

```bash
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/v1/diligence/valuation"
# Expected: 200
```

- [ ] Valuation endpoint returns 200

---

## 3. Learning Agents Verification

### 3.1 Learning API Index

```bash
curl -s "$SERVICE_URL/v1/learn" | jq '.agents'
# Expected: Two agents listed
```

- [ ] Learning index returns 200
- [ ] Lists approval-learning-agent
- [ ] Lists feedback-assimilation-agent

### 3.2 Approval Learning Agent

```bash
# Test with valid input
curl -X POST "$SERVICE_URL/v1/learn/approval" \
  -H "Content-Type: application/json" \
  -d '{
    "execution_ref": "00000000-0000-0000-0000-000000000001",
    "artifact_type": "decision_packet",
    "reviewer": {"id": "test", "role": "executive", "authority_level": "binding"},
    "decision": {"outcome": "APPROVED", "timestamp": "2026-01-22T12:00:00Z"},
    "review_scope": "full",
    "artifact_summary": {"title": "Test"},
    "source_system": "verification-test"
  }' | jq '.success, .agent_id'
# Expected: true "approval-learning-agent"
```

- [ ] Approval endpoint accepts valid input
- [ ] Returns `success: true`
- [ ] Returns correct `agent_id`
- [ ] DecisionEvent persists to ruvector-service (check logs)

### 3.3 Feedback Assimilation Agent

```bash
# Test with valid input
curl -X POST "$SERVICE_URL/v1/learn/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "execution_ref": "00000000-0000-0000-0000-000000000002",
    "artifact_type": "decision_packet",
    "reviewer": {"id": "test", "role": "executive"},
    "feedback_items": [{
      "feedback_id": "00000000-0000-0000-0000-000000000003",
      "feedback_type": "commendation",
      "severity": "informational",
      "content": "Test feedback",
      "timestamp": "2026-01-22T12:00:00Z"
    }],
    "overall_assessment": {
      "quality_rating": "good",
      "completeness_rating": "complete",
      "accuracy_rating": "accurate"
    },
    "review_context": {"review_purpose": "approval"},
    "source_system": "verification-test"
  }' | jq '.success, .agent_id'
# Expected: true "feedback-assimilation-agent"
```

- [ ] Feedback endpoint accepts valid input
- [ ] Returns `success: true`
- [ ] Returns correct `agent_id`
- [ ] DecisionEvent persists to ruvector-service

### 3.4 Inspect Endpoint

```bash
curl -s "$SERVICE_URL/v1/learn/inspect/00000000-0000-0000-0000-000000000001" | jq '.success'
# Expected: true
```

- [ ] Inspect endpoint returns 200
- [ ] Can retrieve previously persisted artifacts

---

## 4. Contract Validation Verification

### 4.1 Invalid Input Rejection

```bash
# Test with invalid input (missing required field)
curl -X POST "$SERVICE_URL/v1/learn/approval" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' \
  -w "\n%{http_code}"
# Expected: 400
```

- [ ] Invalid input returns 400
- [ ] Error response includes validation details

### 4.2 Schema Compliance

- [ ] All responses match agentics-contracts schemas
- [ ] DecisionEvents comply with decision-event.schema.json

---

## 5. Persistence Verification (ruvector-service)

### 5.1 No Direct SQL Access

- [ ] Service logs show NO SQL queries
- [ ] No database connection strings in environment
- [ ] All persistence via `ruvector-service` client

### 5.2 DecisionEvent Persistence

```bash
# Check ruvector-service for persisted events
curl -s "http://ruvector-service/v1/events/decision?execution_ref=00000000-0000-0000-0000-000000000001"
```

- [ ] Events appear in ruvector-service
- [ ] Event structure matches schema
- [ ] Timestamps are UTC

---

## 6. Telemetry Verification (LLM-Observatory)

```bash
# Check telemetry endpoint (if accessible)
curl -s "http://llm-observatory/v1/telemetry/recent?service=agentics-diligence"
```

- [ ] Agent invocation events emitted
- [ ] Agent completion events emitted
- [ ] DecisionEvent emission tracked
- [ ] Persistence events tracked

---

## 7. Non-Responsibility Verification

### 7.1 No Inference Execution

- [ ] Service does NOT call inference endpoints
- [ ] No LLM API calls from learning agents

### 7.2 No Document Mutation

- [ ] Service does NOT modify files
- [ ] Diligence docs are read-only

### 7.3 No Request Routing

- [ ] Service does NOT forward requests
- [ ] No proxy behavior

### 7.4 No Orchestration

- [ ] Service does NOT trigger workflows
- [ ] No orchestration calls

---

## 8. Cloud Run Configuration Verification

```bash
gcloud run services describe agentics-diligence --region us-central1 --format yaml
```

- [ ] Memory: 512Mi
- [ ] CPU: 1
- [ ] Min instances: 0
- [ ] Max instances: 10
- [ ] Timeout: 60s
- [ ] Concurrency: 80
- [ ] Allow unauthenticated: true

---

## 9. Environment Variables Verification

```bash
gcloud run services describe agentics-diligence --region us-central1 \
  --format 'yaml(spec.template.spec.containers[0].env)'
```

- [ ] `SERVICE_NAME` is set
- [ ] `SERVICE_VERSION` is set
- [ ] `PLATFORM_ENV` is set
- [ ] `RUVECTOR_SERVICE_URL` from Secret Manager
- [ ] `LLM_OBSERVATORY_URL` from Secret Manager
- [ ] `LLM_OBSERVATORY_ENABLED` is true

---

## 10. End-to-End Workflow Test

```bash
# Full workflow test
EXEC_REF=$(uuidgen)

# 1. Submit approval
curl -X POST "$SERVICE_URL/v1/learn/approval" \
  -H "Content-Type: application/json" \
  -d "{
    \"execution_ref\": \"$EXEC_REF\",
    \"artifact_type\": \"decision_packet\",
    \"reviewer\": {\"id\": \"e2e-test\", \"role\": \"executive\", \"authority_level\": \"binding\"},
    \"decision\": {\"outcome\": \"APPROVED\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
    \"review_scope\": \"full\",
    \"artifact_summary\": {\"title\": \"E2E Test\"},
    \"source_system\": \"verification-e2e\"
  }" | jq '.success'

# 2. Submit feedback
curl -X POST "$SERVICE_URL/v1/learn/feedback" \
  -H "Content-Type: application/json" \
  -d "{
    \"execution_ref\": \"$EXEC_REF\",
    \"artifact_type\": \"decision_packet\",
    \"reviewer\": {\"id\": \"e2e-test\", \"role\": \"executive\"},
    \"feedback_items\": [{
      \"feedback_id\": \"$(uuidgen)\",
      \"feedback_type\": \"commendation\",
      \"severity\": \"informational\",
      \"content\": \"E2E test feedback\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }],
    \"overall_assessment\": {
      \"quality_rating\": \"excellent\",
      \"completeness_rating\": \"complete\",
      \"accuracy_rating\": \"accurate\"
    },
    \"review_context\": {\"review_purpose\": \"approval\"},
    \"source_system\": \"verification-e2e\"
  }" | jq '.success'

# 3. Inspect artifacts
curl -s "$SERVICE_URL/v1/learn/inspect/$EXEC_REF" | jq '.artifact_count'
# Expected: 2
```

- [ ] Approval submitted successfully
- [ ] Feedback submitted successfully
- [ ] Both artifacts retrievable via inspect

---

## Sign-Off

| Check Category | Status | Verified By | Timestamp |
|----------------|--------|-------------|-----------|
| Service Health | ⬜ | | |
| Documentation Endpoints | ⬜ | | |
| Learning Agents | ⬜ | | |
| Contract Validation | ⬜ | | |
| Persistence (ruvector) | ⬜ | | |
| Telemetry | ⬜ | | |
| Non-Responsibilities | ⬜ | | |
| Cloud Run Config | ⬜ | | |
| Environment Variables | ⬜ | | |
| E2E Workflow | ⬜ | | |

**Deployment Approved:** ⬜ Yes / ⬜ No

**Notes:**
