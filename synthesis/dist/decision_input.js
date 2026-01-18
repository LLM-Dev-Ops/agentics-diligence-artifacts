"use strict";
/**
 * Canonical input structure for the synthesis layer.
 * Implements Executive Decision Packet structure with deterministic extraction.
 *
 * Constraints:
 * - Do NOT hallucinate data
 * - Do NOT infer beyond simulation outputs
 * - Prefer explicit "unknown" over assumption
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDecisionInput = validateDecisionInput;
// ============================================================================
// VALIDATION
// ============================================================================
/**
 * Validates that input conforms to DecisionInput structure.
 */
function validateDecisionInput(input) {
    if (typeof input !== 'object' || input === null) {
        return false;
    }
    const obj = input;
    return (typeof obj.objective === 'string' &&
        typeof obj.command === 'string' &&
        obj.raw_output !== undefined);
}
