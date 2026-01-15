"use strict";
/**
 * Canonical input structure for the synthesis layer.
 * Treats all upstream JSON outputs as opaque evidence.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDecisionInput = validateDecisionInput;
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
