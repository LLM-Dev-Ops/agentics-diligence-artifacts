# CLI Activation Commands - agentics-diligence-artifacts

## Overview

This document defines CLI commands for interacting with the agentics-diligence service.
Commands can be invoked directly via HTTP or through the agentics-cli.

## Service URL Resolution

The CLI dynamically resolves the service URL from environment:

```bash
# Set service URL (or use default)
export AGENTICS_DILIGENCE_URL="${AGENTICS_DILIGENCE_URL:-https://agentics-diligence-1062287243982.us-central1.run.app}"
```

---

## CLI Commands by Agent

### 1. Documentation Generator Commands

#### `docs list`

List available diligence documentation categories.

```bash
# Via curl
curl -s "$AGENTICS_DILIGENCE_URL/v1/diligence" | jq .

# Expected output
{
  "service": "agentics-diligence",
  "version": "1.0.0",
  "endpoints": {
    "index": "/v1/diligence",
    "architecture": "/v1/diligence/architecture",
    "benchmarks": "/v1/diligence/benchmarks",
    "narratives": "/v1/diligence/narratives",
    "valuation": "/v1/diligence/valuation"
  },
  "execution_id": "...",
  "layers_executed": ["request-validation", "index-generation"]
}
```

#### `docs architecture`

Get architecture documentation files.

```bash
curl -s "$AGENTICS_DILIGENCE_URL/v1/diligence/architecture" | jq .

# Expected output
{
  "category": "architecture",
  "files": ["ARCHITECTURE_INDEX.md", "DATA_FLOW_PIPELINE.md", ...],
  "execution_id": "...",
  "layers_executed": ["request-validation", "filesystem-read", "filter-markdown"]
}
```

#### `docs benchmarks`

Get benchmark artifacts.

```bash
curl -s "$AGENTICS_DILIGENCE_URL/v1/diligence/benchmarks" | jq .
```

#### `docs narratives`

Get valuation narratives.

```bash
curl -s "$AGENTICS_DILIGENCE_URL/v1/diligence/narratives" | jq .
```

#### `docs valuation`

Get valuation materials.

```bash
curl -s "$AGENTICS_DILIGENCE_URL/v1/diligence/valuation" | jq .
```

---

### 2. Approval Learning Agent Commands

#### `diligence approve`

Submit an approval/rejection outcome for learning.

```bash
# Via curl
curl -X POST "$AGENTICS_DILIGENCE_URL/v1/learn/approval" \
  -H "Content-Type: application/json" \
  -d '{
    "execution_ref": "550e8400-e29b-41d4-a716-446655440000",
    "artifact_type": "decision_packet",
    "reviewer": {
      "id": "reviewer-001",
      "role": "executive",
      "authority_level": "binding"
    },
    "decision": {
      "outcome": "APPROVED",
      "timestamp": "2026-01-22T12:00:00Z",
      "conditions": []
    },
    "review_scope": "full",
    "artifact_summary": {
      "title": "Q1 Investment Decision"
    },
    "source_system": "agentics-dev-platform"
  }' | jq .

# Expected output
{
  "success": true,
  "execution_id": "...",
  "agent_id": "approval-learning-agent",
  "decision_type": "approval_learning",
  "confidence": 0.95,
  "learning_signal": {
    "signal_type": "positive",
    "strength": 1.0,
    "applicable_to": ["structure", "language_quality", "recommendation_logic"]
  },
  "persistence": {
    "event_id": "...",
    "stored_at": "2026-01-22T12:00:05Z"
  }
}
```

#### CLI Script Wrapper

```bash
#!/bin/bash
# diligence-approve.sh
INPUT_FILE="${1:?Usage: diligence-approve.sh <input.json>}"
curl -X POST "$AGENTICS_DILIGENCE_URL/v1/learn/approval" \
  -H "Content-Type: application/json" \
  -d @"$INPUT_FILE" | jq .
```

---

### 3. Feedback Assimilation Agent Commands

#### `diligence feedback`

Submit reviewer feedback for assimilation.

```bash
# Via curl
curl -X POST "$AGENTICS_DILIGENCE_URL/v1/learn/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "execution_ref": "550e8400-e29b-41d4-a716-446655440000",
    "artifact_type": "decision_packet",
    "reviewer": {
      "id": "reviewer-001",
      "role": "executive",
      "expertise_areas": ["financial_analysis"]
    },
    "feedback_items": [
      {
        "feedback_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567801",
        "feedback_type": "correction",
        "severity": "major",
        "content": "Recommendation lacks supporting rationale",
        "timestamp": "2026-01-22T12:00:00Z"
      }
    ],
    "overall_assessment": {
      "quality_rating": "good",
      "completeness_rating": "mostly_complete",
      "accuracy_rating": "mostly_accurate"
    },
    "review_context": {
      "review_purpose": "approval"
    },
    "source_system": "agentics-dev-platform"
  }' | jq .

# Expected output
{
  "success": true,
  "execution_id": "...",
  "agent_id": "feedback-assimilation-agent",
  "decision_type": "feedback_assimilation",
  "confidence": 0.79,
  "learnings_extracted": 1,
  "quality_signals": {
    "overall_signal": "positive",
    "dimension_scores": {
      "accuracy": 0.8,
      "completeness": 0.8,
      "clarity": 0.85,
      "relevance": 0.7,
      "actionability": 0.8
    }
  },
  "persistence": {
    "event_id": "...",
    "stored_at": "2026-01-22T12:00:05Z"
  }
}
```

#### CLI Script Wrapper

```bash
#!/bin/bash
# diligence-feedback.sh
INPUT_FILE="${1:?Usage: diligence-feedback.sh <input.json>}"
curl -X POST "$AGENTICS_DILIGENCE_URL/v1/learn/feedback" \
  -H "Content-Type: application/json" \
  -d @"$INPUT_FILE" | jq .
```

---

### 4. Inspect Command

#### `inspect`

Retrieve learning artifacts for an execution reference.

```bash
# Via curl
EXECUTION_REF="550e8400-e29b-41d4-a716-446655440000"
curl -s "$AGENTICS_DILIGENCE_URL/v1/learn/inspect/$EXECUTION_REF" | jq .

# Expected output
{
  "success": true,
  "execution_id": "...",
  "execution_ref": "550e8400-e29b-41d4-a716-446655440000",
  "artifact_count": 2,
  "artifacts": [
    {
      "agent_id": "approval-learning-agent",
      "decision_type": "approval_learning",
      "timestamp": "2026-01-22T12:00:05Z",
      "confidence": 0.95
    },
    {
      "agent_id": "feedback-assimilation-agent",
      "decision_type": "feedback_assimilation",
      "timestamp": "2026-01-22T12:05:00Z",
      "confidence": 0.79
    }
  ]
}
```

---

## Command Summary Table

| Command | Endpoint | Method | Agent |
|---------|----------|--------|-------|
| `docs list` | `/v1/diligence` | GET | Documentation Generator |
| `docs architecture` | `/v1/diligence/architecture` | GET | Documentation Generator |
| `docs benchmarks` | `/v1/diligence/benchmarks` | GET | Documentation Generator |
| `docs narratives` | `/v1/diligence/narratives` | GET | Documentation Generator |
| `docs valuation` | `/v1/diligence/valuation` | GET | Documentation Generator |
| `diligence approve` | `/v1/learn/approval` | POST | Approval Learning Agent |
| `diligence feedback` | `/v1/learn/feedback` | POST | Feedback Assimilation Agent |
| `inspect` | `/v1/learn/inspect/:ref` | GET | RuVector Client |

---

## agentics-cli Integration

When using agentics-cli, commands map as follows:

```bash
# List docs
agentics diligence docs list

# Submit approval
agentics diligence approve --file approval-input.json

# Submit feedback
agentics diligence feedback --file feedback-input.json

# Inspect artifacts
agentics diligence inspect 550e8400-e29b-41d4-a716-446655440000
```

The CLI resolves service URL from:
1. `--service-url` flag
2. `AGENTICS_DILIGENCE_URL` environment variable
3. Platform configuration file
4. Default production URL

---

## Error Handling

All commands return structured errors:

```json
{
  "error": "Input validation failed",
  "execution_id": "...",
  "type": "ValidationError",
  "details": [
    {
      "path": "/execution_ref",
      "message": "must be string"
    }
  ]
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Validation error (client error)
- `500` - Server error
