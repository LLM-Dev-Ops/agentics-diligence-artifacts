# Agentics Diligence Artifacts - Agent Verification Checklist

## Overview

This checklist verifies that all diligence-learning agents comply with the
Agentics-Diligence-Artifacts Agent Infrastructure Constitution.

---

## Pre-Deployment Verification

### 1. Contract Compliance

- [ ] Agent imports schemas EXCLUSIVELY from `@agentics/contracts`
- [ ] All inputs are validated against contract schemas
- [ ] All outputs are validated against contract schemas
- [ ] DecisionEvent schema validation passes
- [ ] No additional properties beyond schema definitions

### 2. Execution Model

- [ ] Agent is stateless at runtime
- [ ] Agent produces deterministic output for same input
- [ ] Agent emits exactly ONE DecisionEvent per invocation
- [ ] Agent is deployable as Cloud Run service
- [ ] Agent is deployable as Cloud Job
- [ ] Agent is deployable as CLI process

### 3. Persistence Rules

- [ ] Agent NEVER connects directly to Google SQL
- [ ] Agent NEVER executes SQL
- [ ] ALL persistence is via ruvector-service client calls
- [ ] Reads are via ruvector-service only

### 4. Non-Responsibilities Verification

- [ ] Agent does NOT execute inference
- [ ] Agent does NOT modify documents or templates
- [ ] Agent does NOT route requests
- [ ] Agent does NOT trigger orchestration
- [ ] Agent does NOT apply optimizations automatically
- [ ] Agent does NOT enforce governance decisions

### 5. DecisionEvent Requirements

- [ ] `agent_id` follows lowercase-kebab-case pattern (3-64 chars)
- [ ] `agent_version` follows semantic versioning
- [ ] `decision_type` is one of: `approval_learning`, `feedback_assimilation`
- [ ] `inputs_hash` is SHA-256 (64 hex chars)
- [ ] `outputs` is structured object
- [ ] `confidence` is between 0.0 and 1.0
- [ ] `constraints_applied` includes: `review_scope`, `artifact_type`, `reviewer_role`
- [ ] `execution_ref` is valid UUID
- [ ] `timestamp` is ISO 8601 UTC

### 6. Telemetry

- [ ] Agent emits telemetry compatible with LLM-Observatory
- [ ] Invocation events are emitted on start
- [ ] Completion events are emitted on success
- [ ] Error events are emitted on failure
- [ ] DecisionEvent emission is tracked
- [ ] Persistence events are tracked

### 7. CLI Interface

- [ ] Agent exposes CLI-invokable endpoint
- [ ] `learn` / `assimilate` command processes input
- [ ] `inspect` command retrieves artifacts
- [ ] `--help` displays usage information
- [ ] `--json` outputs machine-readable format
- [ ] `--dry-run` processes without persistence
- [ ] Error handling returns structured output

---

## Smoke Test Commands

### Feedback Assimilation Agent

```bash
# 1. Display help
node src/agents/feedback-assimilation-agent.js --help

# 2. Dry run with test fixture
node src/agents/feedback-assimilation-agent.js assimilate tests/fixtures/feedback-assimilation-input.json --dry-run

# 3. JSON output mode
node src/agents/feedback-assimilation-agent.js assimilate tests/fixtures/feedback-assimilation-input.json --dry-run --json

# 4. Inspect command (requires ruvector-service)
# node src/agents/feedback-assimilation-agent.js inspect 550e8400-e29b-41d4-a716-446655440000
```

### Approval Learning Agent

```bash
# 1. Display help
node src/agents/approval-learning-agent.js --help

# 2. Dry run with test fixture
node src/agents/approval-learning-agent.js learn tests/fixtures/approval-learning-input.json --dry-run

# 3. JSON output mode
node src/agents/approval-learning-agent.js learn tests/fixtures/approval-learning-input.json --dry-run --json

# 4. Inspect command (requires ruvector-service)
# node src/agents/approval-learning-agent.js inspect 660f9500-f39c-52e5-b827-557766551111
```

---

## Automated Test Execution

```bash
# Run full test suite
npm test

# Run specific agent tests
npm test -- --grep "Feedback Assimilation Agent"
npm test -- --grep "Approval Learning Agent"

# Run with coverage
npm run test:coverage
```

---

## Integration Verification

### ruvector-service Integration

```bash
# 1. Verify ruvector-service is accessible
curl -s http://localhost:8080/health | jq .

# 2. Test DecisionEvent persistence (with live service)
node src/agents/feedback-assimilation-agent.js assimilate tests/fixtures/feedback-assimilation-input.json

# 3. Verify event was persisted
curl -s "http://localhost:8080/v1/events/decision?execution_ref=550e8400-e29b-41d4-a716-446655440000" | jq .
```

### LLM-Observatory Integration

```bash
# 1. Verify observatory endpoint is accessible
curl -s http://localhost:9090/health | jq .

# 2. Run agent with telemetry enabled
LLM_OBSERVATORY_ENABLED=true node src/agents/feedback-assimilation-agent.js assimilate tests/fixtures/feedback-assimilation-input.json --dry-run

# 3. Check telemetry batch endpoint received events
curl -s "http://localhost:9090/v1/telemetry/recent?service=agentics-diligence-artifacts" | jq .
```

---

## Contract Validation

```bash
# Validate all schemas
node src/test-validation.js

# Validate specific input fixture
npx ajv validate -s contracts/learning/v1/feedback-assimilation.schema.json \
  -d tests/fixtures/feedback-assimilation-input.json \
  -r "definitions.FeedbackAssimilationInput"
```

---

## Deployment Verification

### Cloud Run

```bash
# 1. Build container
docker build -t diligence-learning-service .

# 2. Run locally
docker run -p 8080:8080 \
  -e RUVECTOR_SERVICE_URL=http://host.docker.internal:8081 \
  -e LLM_OBSERVATORY_URL=http://host.docker.internal:9090 \
  diligence-learning-service

# 3. Test endpoint
curl -X POST http://localhost:8080/v1/learn/feedback \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/feedback-assimilation-input.json
```

### Cloud Job

```bash
# Execute as job with input file
gcloud run jobs execute diligence-learning-job \
  --args="assimilate,/input/feedback.json"
```

### CLI

```bash
# Direct CLI execution
node src/agents/feedback-assimilation-agent.js assimilate input.json --persist
```

---

## Sign-off

| Verification Area | Status | Verified By | Date |
|-------------------|--------|-------------|------|
| Contract Compliance | ⬜ | | |
| Execution Model | ⬜ | | |
| Persistence Rules | ⬜ | | |
| Non-Responsibilities | ⬜ | | |
| DecisionEvent Schema | ⬜ | | |
| Telemetry | ⬜ | | |
| CLI Interface | ⬜ | | |
| ruvector-service Integration | ⬜ | | |
| LLM-Observatory Integration | ⬜ | | |
| Deployment (Cloud Run) | ⬜ | | |
| Deployment (CLI) | ⬜ | | |

---

## Notes

- All agents MUST pass this checklist before deployment
- Any failure requires immediate remediation
- Constitution violations are HARD ERRORS
