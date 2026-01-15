/**
 * Canonical input structure for the synthesis layer.
 * Treats all upstream JSON outputs as opaque evidence.
 */

export interface DecisionInput {
  /** The business objective or question being evaluated */
  objective: string;
  /** The CLI command that was executed */
  command: string;
  /** Raw JSON output from the CLI command - treated as opaque */
  raw_output: unknown;
  /** Optional precedent data for comparative analysis */
  precedent?: unknown;
}

export interface SynthesisResult {
  /** Structured text sections from the LLM */
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
  /** Raw LLM response for debugging */
  raw_response?: string;
}

/**
 * Validates that input conforms to DecisionInput structure.
 */
export function validateDecisionInput(input: unknown): input is DecisionInput {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  const obj = input as Record<string, unknown>;
  return (
    typeof obj.objective === 'string' &&
    typeof obj.command === 'string' &&
    obj.raw_output !== undefined
  );
}
