<p align="center">
  <img src="https://img.shields.io/badge/Agentics-Diligence%20Platform-0066CC?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN2wtOS01eiIvPjxwYXRoIGQ9Ik0xMiAyMlYxMiIvPjxwYXRoIGQ9Ik0xMiAxMkwzIDciLz48cGF0aCBkPSJNMTIgMTJsMTAgLTUiLz48L3N2Zz4=" alt="Agentics Diligence"/>
</p>

<p align="center">
  <strong>Enterprise Due Diligence Artifacts & Executive Decision Intelligence</strong>
</p>

<p align="center">
  <a href="#overview"><img src="https://img.shields.io/badge/Status-Production-success?style=flat-square" alt="Status"/></a>
  <a href="#api-reference"><img src="https://img.shields.io/badge/API-v1.0.0-blue?style=flat-square" alt="API Version"/></a>
  <a href="#verification"><img src="https://img.shields.io/badge/Artifacts-SHA256%20Verified-green?style=flat-square" alt="Verified"/></a>
  <a href="#governance"><img src="https://img.shields.io/badge/Policy-Append%20Only-orange?style=flat-square" alt="Policy"/></a>
  <a href="https://agentics-diligence-1062287243982.us-central1.run.app"><img src="https://img.shields.io/badge/Cloud%20Run-Deployed-4285F4?style=flat-square&logo=google-cloud" alt="Cloud Run"/></a>
</p>

<p align="center">
  <sub>Immutable, verifiable artifacts for enterprise sales, broker-led transactions, and technical due diligence</sub>
</p>

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    ╔═══════════════╗     ╔═══════════════╗     ╔═══════════════╗          │
│    ║  SIMULATION   ║     ║   FINANCIAL   ║     ║   EXECUTIVE   ║          │
│    ║    ENGINE     ║────▶║  ROI ENGINE   ║────▶║   SYNTHESIS   ║          │
│    ╚═══════════════╝     ╚═══════════════╝     ╚═══════════════╝          │
│           │                     │                     │                    │
│           ▼                     ▼                     ▼                    │
│    ┌─────────────┐       ┌─────────────┐       ┌─────────────┐            │
│    │  Scenario   │       │   Dollar    │       │   Board     │            │
│    │  Decisions  │       │   Impact    │       │   Ready     │            │
│    └─────────────┘       └─────────────┘       └─────────────┘            │
│                                                                             │
│              SIMULATION-TO-FINANCIAL-IMPACT PIPELINE                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Overview

This repository serves as the **authoritative source** for Agentics diligence artifacts, providing:

| Component | Description |
|-----------|-------------|
| **Benchmark Artifacts** | Versioned, cryptographically-verified benchmark results from controlled evaluation runs |
| **Architecture Documentation** | Complete simulation-to-financial-impact pipeline specification |
| **Valuation Narratives** | Due diligence materials for architectural risk retirement and ERP abstraction value |
| **Executive Synthesis** | Board-ready decision packet generation from simulation outputs |
| **REST API** | Contract-validated API for programmatic artifact access |

> **Note**: This repository contains no source code for tooling, no credentials, and no customer data. It serves exclusively as a versioned archive of evaluation outputs.

---

## Quick Start

### API Endpoint

```bash
# Health check
curl https://agentics-diligence-1062287243982.us-central1.run.app/

# List all endpoints
curl https://agentics-diligence-1062287243982.us-central1.run.app/v1/diligence

# Get architecture files
curl https://agentics-diligence-1062287243982.us-central1.run.app/v1/diligence/architecture

# Get benchmark files
curl https://agentics-diligence-1062287243982.us-central1.run.app/v1/diligence/benchmarks

# Get valuation documents
curl https://agentics-diligence-1062287243982.us-central1.run.app/v1/diligence/valuation
```

### Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Run contract validation tests
npm test

# Build synthesis layer
npm run build:synthesis
```

---

## Architecture

```
agentics-diligence-artifacts/
│
├── 📊 architecture/                    # Platform architecture documentation
│   ├── ARCHITECTURE_INDEX.md           # Master documentation index
│   ├── DATA_FLOW_PIPELINE.md           # Simulation-to-financial pipeline
│   ├── SIMULATION_TO_FINANCIAL_IMPACT_SUMMARY.md
│   ├── engines/
│   │   ├── SIMULATION_ENGINE.md        # agentics-simulation-engine spec
│   │   └── ENTERPRISE_ROI_ENGINE.md    # enterprise-roi-engine spec
│   ├── examples/
│   │   ├── EXAMPLE_SIMULATION_INPUT.md
│   │   ├── EXAMPLE_SIMULATION_OUTPUT.md
│   │   └── EXAMPLE_FINANCIAL_IMPACT_OUTPUT.md
│   └── governance/
│       └── OWNERSHIP_BOUNDARIES.md     # System ownership definitions
│
├── 📈 benchmarks/                      # Versioned benchmark results
│   └── enterprise-proof-v1/
│       └── reference-run/
│           ├── METADATA.md
│           ├── SHA256SUMS.txt
│           └── enterprise-proof-v1-reference.zip
│
├── 📝 narratives/                      # Due diligence narratives
│   └── ARCHITECTURE_LOCKED_DILIGENCE.md
│
├── 💰 valuation/                       # Valuation documentation
│   ├── ERP_ABSTRACTION_VALUE.md
│   └── architecture-locked-platform/
│       ├── ARCHITECTURE_LOCKED_NARRATIVE.md
│       ├── BROKER_BRIEF.md
│       └── BUYER_POSITIONING.md
│
├── 📜 contracts/                       # JSON Schema API contracts
│   └── diligence/v1/
│       ├── request.schema.json
│       └── response.schema.json
│
├── 🧠 synthesis/                       # Executive Decision Synthesis Layer
│   ├── decision_input.ts              # Canonical input structures
│   ├── extraction.ts                  # Deterministic evidence extraction
│   ├── synthesizer.ts                 # LLM-enhanced synthesis
│   ├── language_quality.ts            # McKinsey-grade language enforcement
│   └── render_markdown.ts             # Board-ready output rendering
│
└── src/
    └── server.js                       # Express API server
```

---

## Executive Synthesis Layer

The synthesis layer transforms raw simulation outputs into **board-ready Executive Decision Packets** with deterministic extraction and McKinsey-grade language quality.

### Canonical 10-Section Structure

| Section | Purpose |
|---------|---------|
| **1. Executive Context** | Decision domain, materiality, urgency driver |
| **2. Decision Framing** | Precise decision, alternatives, inaction scenario |
| **3. Recommendation** | Single disposition: APPROVE / DEFER / REJECT |
| **4. Rationale** | 3-5 evidence-backed bullets |
| **5. Risks & Tradeoffs** | Key risks, accepted tradeoffs, unmitigated exposures |
| **6. Constraints** | Budget, policy, organizational, regulatory |
| **7. ERP Resolutions** | System, workflow, and policy changes |
| **8. Decision Displacement** | What human decision this automates |
| **9. Micro → Macro** | Token-level to enterprise-outcome explanation |
| **10. Next Actions** | Approve, defer, or reject actions with owners |

### Language Quality Enforcement

All outputs are validated against executive communication standards:

- No casual language, emojis, or hedging
- Active voice, declarative sentences
- Automatic rewriting of vague phrases
- Board-deck verbatim ready (score threshold: 80+)

### Usage

```bash
# Generate executive decision packet
npx ts-node synthesis/index.ts \
  --objective "Evaluate deployment readiness" \
  --command "agentics simulate" \
  --input simulation-output.json

# Pipe from simulation
agentics simulate | npx ts-node synthesis/index.ts \
  --objective "Evaluate deployment readiness" \
  --command "agentics simulate"
```

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/v1/diligence` | API index and available endpoints |
| `GET` | `/v1/diligence/architecture` | List architecture documentation |
| `GET` | `/v1/diligence/benchmarks` | List benchmark files |
| `GET` | `/v1/diligence/narratives` | List narrative documents |
| `GET` | `/v1/diligence/valuation` | List valuation materials |

### Contract Validation

All requests are validated against JSON Schema contracts at the HTTP boundary using Ajv in strict mode:

```javascript
{
  strict: true,
  strictTypes: true,
  coerceTypes: false,    // No type coercion
  useDefaults: false,    // No default injection
  allErrors: true        // Return all validation errors
}
```

### Response Format

Every successful response includes execution proof:

```json
{
  "category": "architecture",
  "files": ["ARCHITECTURE_INDEX.md", "DATA_FLOW_PIPELINE.md"],
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "layers_executed": ["request-validation", "filesystem-read", "filter-markdown"]
}
```

---

## Verification

### SHA256 Checksum Verification

All benchmark artifacts include cryptographic checksums for integrity verification.

**Linux/macOS:**

```bash
cd benchmarks/enterprise-proof-v1/reference-run/
sha256sum -c SHA256SUMS.txt
```

**Windows PowerShell:**

```powershell
cd benchmarks\enterprise-proof-v1\reference-run\
Get-Content SHA256SUMS.txt | ForEach-Object {
    $parts = $_ -split '  '
    $expected = $parts[0]
    $file = $parts[1]
    $actual = (Get-FileHash $file -Algorithm SHA256).Hash.ToLower()
    if ($expected -eq $actual) { Write-Host "OK: $file" }
    else { Write-Host "MISMATCH: $file" }
}
```

---

## Governance

### Append-Only Policy

| Rule | Description |
|------|-------------|
| **No Modifications** | Existing artifacts are never modified after publication |
| **No Deletions** | Historical versions are retained indefinitely |
| **New Versions Only** | Corrections result in new versions, not overwrites |

### Access Control

This repository is **private**. Access is granted to:

- Prospective enterprise customers under NDA
- Brokers and transaction advisors
- Private equity firms and acquirers
- Designated technical reviewers

---

## Audience Guide

### For CTOs and Technical Buyers

- Review `architecture/` for pipeline specifications
- Examine benchmark `METADATA.md` for execution parameters
- Verify checksums before procurement decisions

### For Brokers and Transaction Advisors

- Cite specific benchmark versions (e.g., `enterprise-proof-v1`)
- Include SHA256 hashes as fingerprints in data rooms
- Reference `valuation/` for positioning materials

### For Private Equity Technical Teams

- Verify checksums independently before analysis
- Review `narratives/` for architectural risk assessment
- Note artifacts represent point-in-time evaluations

---

## Key Documents

| Document | Audience | Purpose |
|----------|----------|---------|
| `SIMULATION_TO_FINANCIAL_IMPACT_SUMMARY.md` | CFO / Board | Executive summary |
| `DATA_FLOW_PIPELINE.md` | CTO / Tech DD | Complete pipeline spec |
| `OWNERSHIP_BOUNDARIES.md` | Architects | System boundary definitions |
| `ERP_ABSTRACTION_VALUE.md` | Buyers | Value proposition |
| `BROKER_BRIEF.md` | Advisors | Transaction positioning |
| `ARCHITECTURE_LOCKED_DILIGENCE.md` | DD Teams | Risk retirement narrative |

---

## Deployment

### Cloud Run

```bash
# Authenticate
gcloud auth login
gcloud config set project agentics-dev

# Deploy
gcloud run deploy agentics-diligence \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 8080) |
| `OPENAI_API_KEY` | API key for synthesis LLM calls |
| `ANTHROPIC_API_KEY` | Alternative API key for Claude |
| `LLM_MODEL` | Model override for synthesis |

---

## Security

- No credentials, API keys, or secrets stored in artifacts
- All benchmark executions use ephemeral credentials
- Artifacts provide no access to live systems
- All materials classified as confidential business information

---

## Contact

For artifact interpretation, verification assistance, or access requests, contact Agentics through established business channels.

---

<p align="center">
  <sub>Maintained as part of Agentics enterprise diligence infrastructure</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License"/>
</p>
