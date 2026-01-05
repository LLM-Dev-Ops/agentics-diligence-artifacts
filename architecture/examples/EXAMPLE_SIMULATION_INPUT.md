# Example Artifact: Simulation Input Specification

**Classification**: Confidential — For Authorized Reviewers Under NDA
**Purpose**: Example artifact demonstrating simulation input format
**Type**: Reference Example (not executable)
**Cross-References**: SIMULATION_ENGINE.md, DATA_FLOW_PIPELINE.md

---

## Purpose

This document provides a concrete example of a simulation input specification. It demonstrates the format, structure, and content that flows into the agentics-simulation-engine. This example is illustrative and represents a realistic enterprise scenario.

---

## Example: Fortune 500 Procurement Optimization

### Scenario Overview

A Fortune 500 organization with 50,000 employees is evaluating the impact of deploying AI agents to automate procurement approval workflows. The simulation will model the organization's structure, simulate baseline procurement operations, apply an automation intervention, and measure the operational impact.

---

## Complete Simulation Plan

```yaml
#
# SIMULATION PLAN: Fortune 500 Procurement Optimization
# Version: 1.0.0
# Purpose: Model impact of AI agent deployment on procurement approvals
#

simulation_plan:
  # ============================================================
  # METADATA
  # ============================================================
  metadata:
    plan_id: "sim-f500-procurement-2025-001"
    plan_version: "1.0.0"
    created_timestamp: "2025-01-05T00:00:00Z"
    created_by: "simulation_architect"
    description: |
      Simulate procurement approval workflow optimization for a
      50,000-employee Fortune 500 organization through AI agent
      deployment targeting 65% automation of standard approvals.
    tags:
      - "fortune_500"
      - "procurement"
      - "workforce_optimization"
      - "agent_deployment"

  # ============================================================
  # ORGANIZATION MODEL
  # ============================================================
  organization:
    # Basic demographics
    name: "Example Enterprise Corporation"
    industry: "manufacturing"
    employee_count: 50000
    annual_revenue_tier: "fortune_500"

    # Structural parameters
    structure_type: "matrix"
    hierarchy_depth: 7
    average_span_of_control: 8

    # Geographic distribution
    regions:
      - region_id: "NA"
        name: "North America"
        employee_percentage: 0.45
        headquarters: true
      - region_id: "EMEA"
        name: "Europe, Middle East, Africa"
        employee_percentage: 0.30
      - region_id: "APAC"
        name: "Asia Pacific"
        employee_percentage: 0.25

    # Subsidiary structure
    subsidiaries:
      count: 12
      distribution:
        - region: "NA"
          count: 5
        - region: "EMEA"
          count: 4
        - region: "APAC"
          count: 3

    # Cost center configuration
    cost_centers:
      total_count: 450
      distribution_by_function:
        - function: "operations"
          count: 180
          percentage: 0.40
        - function: "sales"
          count: 90
          percentage: 0.20
        - function: "engineering"
          count: 72
          percentage: 0.16
        - function: "corporate"
          count: 54
          percentage: 0.12
        - function: "support"
          count: 54
          percentage: 0.12

  # ============================================================
  # ORGANIZATIONAL TOPOLOGY
  # ============================================================
  topology:
    # Hierarchy configuration
    hierarchy:
      levels:
        - level: 1
          title: "C-Suite"
          typical_count: 8
          approval_authority_usd: "unlimited"
        - level: 2
          title: "EVP/SVP"
          typical_count: 25
          approval_authority_usd: 5000000
        - level: 3
          title: "VP"
          typical_count: 100
          approval_authority_usd: 1000000
        - level: 4
          title: "Senior Director"
          typical_count: 400
          approval_authority_usd: 250000
        - level: 5
          title: "Director"
          typical_count: 1200
          approval_authority_usd: 50000
        - level: 6
          title: "Manager"
          typical_count: 4800
          approval_authority_usd: 10000
        - level: 7
          title: "Individual Contributor"
          typical_count: 43467
          approval_authority_usd: 0

    # Approval chain definitions
    approval_chains:
      - chain_id: "procurement_standard"
        name: "Standard Procurement Approval"
        trigger_conditions:
          - type: "amount_threshold"
            threshold_usd: 10000
            comparison: "greater_than"
        required_approvals:
          - level_delta: 1
            role: "direct_manager"
            sla_hours: 8
          - level_delta: 2
            role: "skip_level_manager"
            sla_hours: 16
          - level_delta: 3
            role: "department_head"
            sla_hours: 24
        escalation_rules:
          - trigger: "sla_breach"
            action: "notify_next_level"
            auto_approve_after_hours: 72

      - chain_id: "procurement_high_value"
        name: "High-Value Procurement Approval"
        trigger_conditions:
          - type: "amount_threshold"
            threshold_usd: 100000
            comparison: "greater_than"
        required_approvals:
          - level_delta: 1
            role: "direct_manager"
            sla_hours: 4
          - level_delta: 2
            role: "skip_level_manager"
            sla_hours: 8
          - level_delta: 3
            role: "department_head"
            sla_hours: 16
          - level_delta: 4
            role: "vp_level"
            sla_hours: 24
          - level_delta: 5
            role: "finance_review"
            sla_hours: 24
        escalation_rules:
          - trigger: "sla_breach"
            action: "executive_notification"
            auto_approve_after_hours: null  # No auto-approve for high value

      - chain_id: "procurement_emergency"
        name: "Emergency Procurement"
        trigger_conditions:
          - type: "flag"
            flag_name: "emergency"
            flag_value: true
        required_approvals:
          - level_delta: 2
            role: "skip_level_manager"
            sla_hours: 2
        escalation_rules:
          - trigger: "sla_breach"
            action: "immediate_escalation"

    # Delegation rules
    delegation_rules:
      - rule_id: "vacation_delegation"
        trigger: "approver_absent"
        action: "delegate_to_peer"
        constraints:
          - same_level_or_higher: true
          - same_department: true
      - rule_id: "overload_delegation"
        trigger: "pending_count_exceeds"
        threshold: 20
        action: "delegate_to_backup"

  # ============================================================
  # BASELINE OPERATIONS
  # ============================================================
  baseline:
    # Procurement workflow volumes
    procurement:
      annual_requests: 15000
      distribution_by_amount:
        - range: "0-1000"
          percentage: 0.35
          average_usd: 500
        - range: "1001-10000"
          percentage: 0.40
          average_usd: 5000
        - range: "10001-100000"
          percentage: 0.20
          average_usd: 35000
        - range: "100001+"
          percentage: 0.05
          average_usd: 250000

    # Current performance metrics
    current_performance:
      avg_approval_time_hours: 24.5
      median_approval_time_hours: 18.0
      p95_approval_time_hours: 72.0
      escalation_rate: 0.08
      rejection_rate: 0.12
      error_rate: 0.023

    # Resource allocation
    resource_allocation:
      fte_dedicated_to_approvals: 125
      hours_per_approval_average: 2.5
      approvals_per_fte_per_day: 3.2

  # ============================================================
  # INTERVENTION SCENARIO
  # ============================================================
  scenario:
    # Intervention identification
    intervention_id: "int-agent-procurement-001"
    intervention_type: "agent_deployment"
    intervention_name: "AI Agent Procurement Approval Automation"

    # Scope definition
    scope:
      target_workflow: "procurement_approval"
      target_processes_annual: 15000
      eligibility_criteria:
        - criterion: "amount_under_threshold"
          threshold_usd: 50000
        - criterion: "vendor_pre_approved"
          vendor_list: "approved_vendor_database"
        - criterion: "budget_available"
          check_type: "real_time"
        - criterion: "no_policy_exceptions"
          exception_flags: []

    # Expected outcomes
    expected_outcomes:
      automation_rate: 0.65
      time_reduction_automated: 0.95
      time_reduction_assisted: 0.50
      error_reduction: 0.70

    # Deployment parameters
    deployment:
      rollout_type: "phased"
      phase_1_percentage: 0.25
      phase_2_percentage: 0.50
      phase_3_percentage: 1.00
      training_hours_per_user: 2

  # ============================================================
  # SIMULATION PARAMETERS
  # ============================================================
  simulation_parameters:
    # Determinism
    random_seed: 42
    reproducibility_mode: "strict"

    # Execution
    simulation_duration_months: 12
    time_step_granularity: "hourly"
    parallel_execution: true

    # Output configuration
    output_format: "canonical_v1"
    include_decision_traces: true
    trace_sampling_rate: 1.0  # 100% of decisions traced

    # Validation
    validate_inputs: true
    validate_outputs: true
    checksum_algorithm: "sha256"
```

---

## Input Component Breakdown

### 1. Metadata Section

Provides identification and context for the simulation plan.

| Field | Purpose | Example Value |
|-------|---------|---------------|
| `plan_id` | Unique identifier | `sim-f500-procurement-2025-001` |
| `plan_version` | Plan version for tracking | `1.0.0` |
| `created_timestamp` | Creation time (ISO 8601) | `2025-01-05T00:00:00Z` |
| `description` | Human-readable purpose | Multi-line description |
| `tags` | Categorization labels | `fortune_500`, `procurement` |

### 2. Organization Section

Defines the enterprise structure to model.

| Field | Purpose | Example Value |
|-------|---------|---------------|
| `employee_count` | Total workforce size | `50000` |
| `structure_type` | Organizational model | `matrix` |
| `hierarchy_depth` | Number of levels | `7` |
| `regions` | Geographic distribution | NA, EMEA, APAC |
| `cost_centers` | Financial units | `450` total |

### 3. Topology Section

Specifies organizational relationships and rules.

| Component | Purpose |
|-----------|---------|
| Hierarchy levels | Define approval authority |
| Approval chains | Specify workflow rules |
| Delegation rules | Handle absences and overload |

### 4. Baseline Section

Documents current state before intervention.

| Metric | Purpose | Example Value |
|--------|---------|---------------|
| `annual_requests` | Volume to simulate | `15000` |
| `avg_approval_time_hours` | Current performance | `24.5` |
| `error_rate` | Current quality | `0.023` (2.3%) |
| `fte_dedicated` | Current staffing | `125` |

### 5. Scenario Section

Defines the intervention to simulate.

| Field | Purpose | Example Value |
|-------|---------|---------------|
| `intervention_type` | Category of change | `agent_deployment` |
| `target_processes_annual` | Scope | `15000` |
| `automation_rate` | Expected automation | `0.65` (65%) |
| `error_reduction` | Expected quality improvement | `0.70` (70% reduction) |

### 6. Simulation Parameters Section

Controls simulation execution.

| Parameter | Purpose | Example Value |
|-----------|---------|---------------|
| `random_seed` | Determinism control | `42` |
| `simulation_duration_months` | Time horizon | `12` |
| `include_decision_traces` | Audit logging | `true` |
| `checksum_algorithm` | Integrity verification | `sha256` |

---

## Validation Rules Applied

Before simulation execution, this input is validated:

| Validation | Rule | This Example |
|------------|------|--------------|
| `plan_id` format | UUID-like string | ✓ Pass |
| `employee_count` | 1 ≤ n ≤ 1,000,000 | ✓ Pass (50,000) |
| `hierarchy_depth` | 1 ≤ n ≤ 15 | ✓ Pass (7) |
| `automation_rate` | 0 ≤ n ≤ 1 | ✓ Pass (0.65) |
| `random_seed` | Integer | ✓ Pass (42) |
| Region percentages | Sum to 1.0 | ✓ Pass (0.45+0.30+0.25=1.0) |
| Approval chain levels | Consistent with hierarchy | ✓ Pass |

---

## What This Input Does NOT Contain

This input specification deliberately excludes:

| Excluded Element | Rationale |
|------------------|-----------|
| Dollar savings projections | Financial calculations are downstream |
| Salary or cost data | Financial parameters are separate |
| ROI calculations | Financial domain is separate |
| Executive summaries | Presentation is downstream |
| Live system connections | Simulation is deterministic |

---

## Expected Output Reference

This input specification, when executed by the simulation engine, produces the output documented in `EXAMPLE_SIMULATION_OUTPUT.md`.

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Final |
| Classification | Confidential |
| Repository | agentics-diligence-artifacts |
| Path | architecture/examples/EXAMPLE_SIMULATION_INPUT.md |
| Cross-References | EXAMPLE_SIMULATION_OUTPUT.md, EXAMPLE_FINANCIAL_IMPACT_OUTPUT.md |
