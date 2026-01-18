/**
 * Canonical input structure for the synthesis layer.
 * Implements Executive Decision Packet structure with deterministic extraction.
 *
 * Constraints:
 * - Do NOT hallucinate data
 * - Do NOT infer beyond simulation outputs
 * - Prefer explicit "unknown" over assumption
 */
/** Policy violation extracted from simulation */
export interface PolicyViolation {
    rule: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    source: string;
}
/** Cost variance from simulation */
export interface CostVariance {
    category: string;
    baseline: number;
    actual: number;
    variance: number;
    variancePercent: number;
    currency: string;
}
/** Failure rate metrics */
export interface FailureRate {
    component: string;
    rate: number;
    threshold: number;
    breached: boolean;
    sampleSize: number;
}
/** Latency impact metrics */
export interface LatencyImpact {
    operation: string;
    p50: number;
    p95: number;
    p99: number;
    baseline_p95: number;
    degradation_percent: number;
    unit: 'ms' | 's';
}
/** Binding constraint detected */
export interface BindingConstraint {
    type: 'policy' | 'budget' | 'organizational' | 'regulatory';
    name: string;
    limit: string;
    current: string;
    binding: boolean;
    source: string;
}
/** Micro-level distribution data */
export interface MicroDistribution {
    metric: string;
    distribution: {
        min: number;
        max: number;
        mean: number;
        median: number;
        stdDev: number;
    };
    sampleSize: number;
    unit: string;
}
export interface DecisionInput {
    /** The business objective or question being evaluated */
    objective: string;
    /** The CLI command that was executed */
    command: string;
    /** Raw JSON output from the CLI command - treated as opaque */
    raw_output: unknown;
    /** Optional precedent data for comparative analysis */
    precedent?: unknown;
    /** Plan type for decision framing */
    plan_type?: 'deployment' | 'migration' | 'optimization' | 'remediation' | 'assessment';
    /** Simulation goal extracted from command intent */
    simulation_goal?: string;
}
/** Recommendation disposition - NO multi-path allowed */
export type RecommendationDisposition = 'APPROVE' | 'DEFER' | 'REJECT';
export interface ExecutiveContext {
    decision_domain: string;
    materiality: string;
    urgency_driver: string;
}
export interface DecisionFraming {
    decision_required: string;
    alternatives_considered: Array<{
        path: string;
        description: string;
    }>;
    inaction_scenario: string;
}
export interface Recommendation {
    disposition: RecommendationDisposition;
    statement: string;
    rationale_bullets: Array<{
        finding: string;
        evidence_source: string;
        business_outcome: string;
    }>;
}
export interface RisksAndTradeoffs {
    key_risks: Array<{
        risk: string;
        likelihood: 'high' | 'medium' | 'low';
        impact: 'high' | 'medium' | 'low';
        accepted_because: string;
    }>;
    tradeoffs_accepted: Array<{
        choosing: string;
        forgoing: string;
        in_exchange_for: string;
    }>;
    unmitigated_risks: Array<{
        risk: string;
        level: string;
        reason_accepted: string;
    }>;
}
export interface Constraints {
    budget?: {
        ceiling: string;
        envelope: string;
        contingency: string;
    };
    policy: string[];
    organizational: string[];
    regulatory: string[];
}
export interface ERPResolution {
    type: 'system' | 'workflow' | 'policy';
    action: string;
    target: string;
    effective_date?: string;
}
export interface DecisionDisplacement {
    statement: string;
    enterprise_activity: string;
}
export interface MicroMacroNarrative {
    operational_action: string;
    aggregation_effect: string;
    enterprise_outcome: string;
}
export interface NextActions {
    approve: Array<{
        action: string;
        owner: string;
        timeline: string;
    }>;
    defer: Array<{
        action: string;
        pending: string;
        revisit_date: string;
    }>;
    reject: Array<{
        alternative: string;
        reason: string;
    }>;
}
export interface SynthesisResult {
    /** Section 1: Executive Context */
    executive_context: ExecutiveContext;
    /** Section 2: Decision Framing (MANDATORY) */
    decision_framing: DecisionFraming;
    /** Section 3: Recommendation (EXPLICIT) */
    recommendation: Recommendation;
    /** Section 4: Rationale - included in recommendation.rationale_bullets */
    /** Section 5: Risks & Tradeoffs */
    risks_and_tradeoffs: RisksAndTradeoffs;
    /** Section 6: Constraints */
    constraints: Constraints;
    /** Section 7: ERP-Level Proposed Resolutions */
    erp_resolutions: ERPResolution[];
    /** Section 8: Decision Displacement */
    decision_displacement: DecisionDisplacement;
    /** Section 9: Micro → Macro Explanation */
    micro_macro_narrative: MicroMacroNarrative;
    /** Section 10: Next Actions */
    next_actions: NextActions;
    /** Metadata */
    metadata: {
        generated_at: string;
        data_completeness: 'complete' | 'partial' | 'minimal';
        confidence_level: 'high' | 'medium' | 'low';
        assumptions: string[];
    };
    /** Raw LLM response for debugging */
    raw_response?: string;
}
/** Legacy format for backward compatibility */
export interface LegacySynthesisResult {
    sections: {
        objective: string;
        evaluated: string;
        findings: {
            financial_impact: string;
            risk_exposure: string;
            system_complexity: string;
        };
        comparative_scenarios: string;
        recommendation: string;
        confidence_assumptions: string;
    };
    raw_response?: string;
}
export interface ExtractedEvidence {
    policy_violations: PolicyViolation[];
    cost_variances: CostVariance[];
    failure_rates: FailureRate[];
    latency_impacts: LatencyImpact[];
    binding_constraints: BindingConstraint[];
    micro_distributions: MicroDistribution[];
    raw_metrics: Record<string, unknown>;
}
/**
 * Validates that input conforms to DecisionInput structure.
 */
export declare function validateDecisionInput(input: unknown): input is DecisionInput;
//# sourceMappingURL=decision_input.d.ts.map