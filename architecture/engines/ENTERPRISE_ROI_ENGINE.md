# Enterprise ROI Engine: Technical Architecture Specification

**Classification**: Confidential — For Authorized Reviewers Under NDA
**Purpose**: Technical Due Diligence Documentation
**Scope**: enterprise-roi-engine ownership, responsibilities, and boundaries
**Cross-References**: SIMULATION_ENGINE.md, DATA_FLOW_PIPELINE.md, OWNERSHIP_BOUNDARIES.md

---

## Executive Summary

The enterprise-roi-engine transforms deterministic simulation outputs into CFO-grade financial artifacts. It applies financial calculations, risk adjustments, and actuarial methodologies to convert operational metrics (FTEs freed, hours saved, error rates reduced) into quantified financial outcomes (dollar savings, risk-adjusted deltas, annualized impact summaries).

This document defines what the ROI engine owns, how it transforms simulation outputs, and where its responsibilities begin and end—enabling acquirers to understand "what does this system own?" and "why this architecture reliably converts simulated decisions into quantified financial outcomes."

---

## 1. System Ownership Definition

### 1.1 What the ROI Engine Owns

| Responsibility | Description | Governance |
|----------------|-------------|------------|
| **Financial Modeling** | Converting operational metrics to dollar values | Methodology-documented |
| **Cost Structures** | Applying labor costs, overhead rates, burden factors | Configurable |
| **Risk Adjustment** | Applying confidence intervals and risk factors | Actuarial |
| **Time Value** | Annualization, discounting, NPV calculations | Financial standards |
| **Impact Aggregation** | Rolling up to executive-level summaries | Presentation |
| **Artifact Generation** | Producing CFO-grade financial documents | Audit-ready |

### 1.2 What the ROI Engine Does NOT Own

| Excluded Responsibility | Rationale | Owning System |
|------------------------|-----------|---------------|
| Organizational modeling | Domain separation | agentics-simulation-engine |
| Workflow simulation | Domain separation | agentics-simulation-engine |
| Process metrics generation | Upstream responsibility | agentics-simulation-engine |
| Decision tracing | Upstream responsibility | agentics-simulation-engine |
| Determinism guarantees | Upstream responsibility | agentics-simulation-engine |
| Live data collection | Architecture principle | Out of scope |

---

## 2. Architectural Principles

### 2.1 Downstream-Only Design

The ROI engine is a pure consumer of simulation outputs. It:

- **Never** requests re-execution of simulations
- **Never** modifies simulation parameters
- **Never** feeds back into the simulation engine
- **Always** treats simulation output as immutable input

This unidirectional data flow ensures clear auditability: any financial artifact can be traced back to a specific, immutable simulation output.

### 2.2 Configurable Financial Parameters

All financial assumptions are externalized as configuration, not embedded in code:

```yaml
financial_parameters:
  labor_costs:
    fully_loaded_fte_annual_usd: 150000
    burden_rate: 1.35
    regional_adjustments:
      NA: 1.0
      EMEA: 0.92
      APAC: 0.78

  time_value:
    discount_rate_annual: 0.08
    projection_horizon_years: 5

  risk_factors:
    implementation_risk: 0.15
    adoption_risk: 0.10
    technology_risk: 0.05

  confidence_intervals:
    conservative: 0.70
    moderate: 0.85
    aggressive: 1.0
```

This externalization ensures:
- Acquirers can substitute their own assumptions
- Financial auditors can review parameters independently
- Sensitivity analysis is straightforward
- No hidden financial logic in code

### 2.3 Audit Trail Preservation

Every financial calculation preserves:
- The simulation output it was derived from
- The financial parameters applied
- The calculation methodology used
- The timestamp of calculation
- The engine version that performed it

---

## 3. Input Specification

### 3.1 Required Simulation Output Fields

The ROI engine consumes the canonical simulation output format. Required fields:

```yaml
required_from_simulation:
  resource_metrics:
    - fte_freed                    # Decimal, required
    - person_hours_saved_annual    # Integer, required

  time_metrics:
    - time_reduction_percent       # Decimal 0-100, required

  quality_metrics:
    - error_reduction_percent      # Decimal 0-100, optional

  process_metrics:
    - processes_automated          # Integer, required
    - automation_rate_achieved     # Decimal 0-1, required

  metadata:
    - output_id                    # String, required
    - plan_id                      # String, required
    - determinism_checksum         # String, required
```

### 3.2 Input Validation

The ROI engine validates simulation outputs before processing:

| Validation | Rule | Failure Behavior |
|------------|------|------------------|
| Schema compliance | Output matches expected schema version | Reject with error |
| Checksum verification | Determinism checksum is valid SHA256 | Reject with error |
| Metric bounds | Values within reasonable ranges | Warning + proceed |
| Completeness | All required fields present | Reject with error |

---

## 4. Financial Transformation Logic

### 4.1 Core Calculations

#### FTE Savings Calculation

```
fte_savings_annual_usd =
    fte_freed
    × fully_loaded_fte_annual_usd
    × burden_rate
    × regional_adjustment
```

#### Person-Hours Savings Calculation

```
hourly_rate = fully_loaded_fte_annual_usd / 2080  # Standard work hours

person_hours_savings_usd =
    person_hours_saved_annual
    × hourly_rate
    × burden_rate
```

#### Error Reduction Value Calculation

```
error_cost_per_incident = configurable_parameter  # Default: $500

error_reduction_value_usd =
    baseline_processes
    × (baseline_error_rate - post_error_rate)
    × error_cost_per_incident
```

### 4.2 Risk Adjustment Methodology

All savings projections are risk-adjusted using three scenarios:

| Scenario | Risk Factor | Calculation |
|----------|-------------|-------------|
| Conservative | 0.70 | gross_savings × 0.70 |
| Moderate | 0.85 | gross_savings × 0.85 |
| Aggressive | 1.00 | gross_savings × 1.00 |

The default presentation uses the **moderate** scenario. All three are provided for CFO review.

### 4.3 Time Value Calculations

Multi-year projections apply discounting:

```
year_n_present_value = year_n_savings / (1 + discount_rate)^n

npv_total = Σ(year_n_present_value) for n = 1 to horizon_years
```

---

## 5. Output Specification

### 5.1 Financial Impact Output Structure

```yaml
financial_impact_output:
  metadata:
    impact_id: "roi-2025-001-xyz789"
    source_simulation_id: "simout-2025-001-abc123"
    simulation_checksum: "sha256:output456..."
    engine_version: "1.0.0"
    calculation_timestamp: "2025-01-05T14:00:00Z"
    financial_parameters_version: "1.0.0"

  annual_impact_summary:
    gross_savings_usd: 16875000
    risk_adjusted_savings:
      conservative_usd: 11812500
      moderate_usd: 14343750
      aggressive_usd: 16875000
    primary_drivers:
      - driver: "fte_optimization"
        contribution_usd: 12187500
        contribution_percent: 72.2
      - driver: "time_efficiency"
        contribution_usd: 3375000
        contribution_percent: 20.0
      - driver: "error_reduction"
        contribution_usd: 1312500
        contribution_percent: 7.8

  five_year_projection:
    discount_rate: 0.08
    annual_figures:
      - year: 1
        nominal_usd: 14343750
        present_value_usd: 13281250
      - year: 2
        nominal_usd: 14343750
        present_value_usd: 12297454
      - year: 3
        nominal_usd: 14343750
        present_value_usd: 11386532
      - year: 4
        nominal_usd: 14343750
        present_value_usd: 10543085
      - year: 5
        nominal_usd: 14343750
        present_value_usd: 9762116
    npv_total_usd: 57270437

  calculation_audit_trail:
    fte_savings:
      input_fte_freed: 81.25
      fully_loaded_cost: 150000
      burden_rate: 1.35
      calculation: "81.25 × 150000 × 1.35"
      result_usd: 16453125
    person_hours_savings:
      input_hours: 169000
      hourly_rate: 72.12
      calculation: "169000 × 72.12"
      result_usd: 12188280
    # Deduplication applied to avoid double-counting
    deduplication_note: "FTE and person-hours overlap adjusted"

  provenance:
    simulation_reference: "simout-2025-001-abc123"
    parameters_reference: "params-v1.0.0"
    methodology_reference: "methodology-v1.0.0"
```

### 5.2 Executive Summary Output

A CFO-grade summary suitable for board presentation:

```yaml
executive_summary:
  title: "Enterprise AI Deployment: Financial Impact Assessment"
  prepared_date: "2025-01-05"

  headline_metrics:
    annual_savings_moderate: "$14.3M"
    five_year_npv: "$57.3M"
    payback_period_months: 4
    roi_percentage: 312

  key_findings:
    - "81 FTE equivalent capacity freed for reallocation"
    - "169,000 person-hours saved annually"
    - "65% reduction in process errors"
    - "83% reduction in approval cycle time"

  risk_assessment:
    overall_confidence: "Moderate"
    key_risks:
      - risk: "Implementation timeline"
        mitigation: "Phased rollout approach"
      - risk: "User adoption"
        mitigation: "Change management program"

  methodology_note: |
    Figures derived from deterministic simulation of 50,000-employee
    organization. Risk-adjusted using moderate scenario (85% factor).
    Five-year NPV calculated at 8% discount rate.

  source_reference: "Simulation ID: simout-2025-001-abc123"
```

---

## 6. Artifact Types

### 6.1 Standard Artifacts Produced

| Artifact | Format | Audience | Purpose |
|----------|--------|----------|---------|
| Financial Impact Report | YAML/JSON | Technical reviewers | Detailed calculations |
| Executive Summary | Markdown/PDF | CFO, Board | Decision support |
| Calculation Audit Trail | JSON | Financial auditors | Verification |
| Sensitivity Analysis | CSV | Financial planners | Scenario planning |
| Methodology Documentation | Markdown | Due diligence teams | Methodology review |

### 6.2 Artifact Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ARTIFACT DEPENDENCY GRAPH                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐                                          │
│  │ Simulation Output    │ (Upstream - immutable input)              │
│  │ simout-2025-001      │                                          │
│  └──────────┬───────────┘                                          │
│             │                                                       │
│             ▼                                                       │
│  ┌──────────────────────┐     ┌────────────────────────┐           │
│  │ Financial Parameters │────▶│ Financial Impact       │           │
│  │ params-v1.0.0        │     │ Report (Primary)       │           │
│  └──────────────────────┘     │ roi-2025-001           │           │
│                               └──────────┬─────────────┘           │
│                                          │                          │
│                    ┌─────────────────────┼─────────────────────┐    │
│                    │                     │                     │    │
│                    ▼                     ▼                     ▼    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────┐│
│  │ Executive Summary   │  │ Audit Trail         │  │ Sensitivity   ││
│  │ (CFO-grade)         │  │ (Verification)      │  │ Analysis      ││
│  └─────────────────────┘  └─────────────────────┘  └───────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Boundaries and Integration

### 7.1 Upstream Boundary (Simulation Engine)

The ROI engine receives:
- Validated simulation outputs only
- Immutable data (never modified)
- Operational metrics (not financial values)

The ROI engine never sends:
- Feedback to simulation engine
- Requests for re-simulation
- Parameter modifications

### 7.2 Downstream Consumers

Financial impact outputs may be consumed by:
- Human reviewers (CFOs, boards, diligence teams)
- Reporting systems (with explicit integration)
- Archival systems (for audit retention)

### 7.3 Integration Point

```
┌────────────────────────────┐
│                            │
│  SIMULATION OUTPUT         │
│  (Immutable Input)         │
│                            │
│  Contains:                 │
│  • Process metrics         │
│  • Time metrics            │
│  • Resource metrics        │
│  • Quality metrics         │
│                            │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐     ┌────────────────────────┐
│                            │     │                        │
│  ENTERPRISE ROI ENGINE     │     │  FINANCIAL PARAMETERS  │
│                            │◀────│  (Configurable)        │
│  Owns: Financial           │     │                        │
│  transformation            │     └────────────────────────┘
│                            │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│                            │
│  FINANCIAL IMPACT OUTPUT   │
│                            │
│  Contains:                 │
│  • Dollar savings          │
│  • Risk-adjusted deltas    │
│  • NPV projections         │
│  • Executive summaries     │
│  • Audit trails            │
│                            │
└────────────────────────────┘
```

---

## 8. Non-Claims Section

This document does not assert:

### 8.1 Accuracy Claims
- No guarantee that projections will match actual outcomes
- No warranty on financial parameter appropriateness
- No claim of applicability to specific enterprises

### 8.2 Methodology Claims
- No assertion of regulatory compliance for specific jurisdictions
- No claim of GAAP/IFRS certification
- No actuarial certification

### 8.3 Integration Claims
- No connection to live financial systems
- No real-time calculation capability
- No automatic reporting system integration

---

## 9. Verification Guidance

Technical due diligence reviewers should verify:

### 9.1 Calculation Verification
1. Obtain simulation output and financial parameters
2. Manually recalculate key figures
3. Compare to engine outputs
4. Verify audit trail completeness

### 9.2 Parameter Verification
1. Review financial parameter configuration
2. Assess reasonableness of assumptions
3. Compare to industry benchmarks
4. Evaluate sensitivity to parameter changes

### 9.3 Boundary Enforcement
1. Confirm no upstream feedback to simulation
2. Verify immutability of input handling
3. Check separation from simulation logic

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Final |
| Classification | Confidential |
| Repository | agentics-diligence-artifacts |
| Path | architecture/engines/ENTERPRISE_ROI_ENGINE.md |
| Cross-References | SIMULATION_ENGINE.md, DATA_FLOW_PIPELINE.md, OWNERSHIP_BOUNDARIES.md |
