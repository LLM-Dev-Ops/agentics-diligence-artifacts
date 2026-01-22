# Service Topology - agentics-diligence-artifacts

## Unified Service Definition

| Property | Value |
|----------|-------|
| **Service Name** | `agentics-diligence` |
| **GCP Project** | `agentics-dev` |
| **Region** | `us-central1` |
| **Runtime** | Node.js 20 |
| **Platform** | Google Cloud Run |

## Agent Endpoints

All agents are exposed through ONE unified service. No agent is deployed as a standalone service.

### Endpoint Mapping

| Agent | Endpoint | Method | Description |
|-------|----------|--------|-------------|
| **Health Check** | `/` | GET | Service health status |
| **API Index** | `/v1/diligence` | GET | Service metadata and endpoint listing |
| **Diligence Docs** | `/v1/diligence/architecture` | GET | Architecture documentation |
| **Diligence Docs** | `/v1/diligence/benchmarks` | GET | Benchmark artifacts |
| **Diligence Docs** | `/v1/diligence/narratives` | GET | Narrative documents |
| **Diligence Docs** | `/v1/diligence/valuation` | GET | Valuation materials |
| **Approval Learning** | `/v1/learn/approval` | POST | Process approval outcomes |
| **Feedback Assimilation** | `/v1/learn/feedback` | POST | Process reviewer feedback |
| **Inspect Artifacts** | `/v1/learn/inspect/:execution_ref` | GET | Retrieve learning artifacts |

## Architecture Confirmation

### Shared Runtime
- [x] All agents run in single Cloud Run container
- [x] Shared Express.js server instance
- [x] Common middleware (validation, telemetry, error handling)
- [x] Single deployment unit

### Shared Configuration
- [x] Environment variables loaded at startup
- [x] Contract schemas from `@agentics/contracts`
- [x] Telemetry configuration from environment

### Shared Telemetry Stack
- [x] LLM-Observatory integration
- [x] Unified telemetry emitter
- [x] Common event types and formats

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    agentics-diligence                           │
│                  (Cloud Run Service)                            │
│                                                                 │
│  ┌─────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │  Diligence  │  │ Approval Learning │  │    Feedback      │  │
│  │    Docs     │  │      Agent        │  │  Assimilation    │  │
│  └─────────────┘  └───────────────────┘  └──────────────────┘  │
│         │                   │                      │            │
│         └───────────────────┼──────────────────────┘            │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌───────────┐ ┌──────────────────┐
    │ ruvector-service│ │LLM-Observ.│ │agentics-contracts│
    │  (Persistence)  │ │(Telemetry)│ │    (Schemas)     │
    └─────────────────┘ └───────────┘ └──────────────────┘
              │
              ▼
    ┌─────────────────┐
    │  Google SQL     │
    │  (PostgreSQL)   │
    └─────────────────┘
```

## Non-Responsibilities (Enforced)

agentics-diligence-artifacts DOES NOT:
- Execute inference
- Route requests to other services
- Execute workflows
- Enforce policies or decisions
- Optimize configurations
- Mutate upstream systems or artifacts
- Connect directly to databases

## Consumers

The following systems MAY consume outputs:
- `agentics-dev-platform`
- Governance workflows
- Audit workflows
- Investor reporting
- M&A diligence tooling
- Sales documentation tooling
