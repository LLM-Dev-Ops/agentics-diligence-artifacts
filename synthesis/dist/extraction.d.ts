/**
 * Deterministic Extraction Utilities for Synthesis Builder
 *
 * Constraints:
 * - Do NOT hallucinate data
 * - Do NOT infer beyond simulation outputs
 * - Prefer explicit "unknown" over assumption
 * - All extraction is from simulation evidence ONLY
 */
import { ExtractedEvidence, DecisionInput, RecommendationDisposition } from './decision_input';
/**
 * Extracts all evidence from raw simulation output.
 * Returns explicit "unknown" for missing data - NEVER infers.
 */
export declare function extractEvidence(rawOutput: unknown): ExtractedEvidence;
/**
 * Extracts decision framing from command intent, plan type, and simulation goal.
 */
export declare function extractDecisionFraming(input: DecisionInput): {
    decision_required: string;
    alternatives: Array<{
        path: string;
        description: string;
    }>;
    inaction_scenario: string;
};
/**
 * Determines recommendation disposition based on evidence.
 * Returns SINGLE disposition: APPROVE, DEFER, or REJECT.
 * NO multi-path recommendations.
 */
export declare function determineRecommendation(evidence: ExtractedEvidence): RecommendationDisposition;
/**
 * Builds recommendation statement based on disposition and evidence.
 */
export declare function buildRecommendationStatement(disposition: RecommendationDisposition, evidence: ExtractedEvidence, objective: string): string;
/**
 * Extracts risks and tradeoffs directly from simulation evidence.
 */
export declare function extractRisksAndTradeoffs(evidence: ExtractedEvidence): {
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
};
/**
 * Detects binding constraints from evidence.
 */
export declare function detectConstraints(evidence: ExtractedEvidence): {
    budget?: {
        ceiling: string;
        envelope: string;
        contingency: string;
    };
    policy: string[];
    organizational: string[];
    regulatory: string[];
};
/**
 * Generates decision displacement statement.
 * Maps to a real enterprise activity.
 */
export declare function generateDecisionDisplacement(planType: string | undefined, objective: string): {
    statement: string;
    enterprise_activity: string;
};
/**
 * Builds micro to macro narrative from distributions and metrics.
 */
export declare function buildMicroMacroNarrative(evidence: ExtractedEvidence, objective: string): {
    operational_action: string;
    aggregation_effect: string;
    enterprise_outcome: string;
};
//# sourceMappingURL=extraction.d.ts.map