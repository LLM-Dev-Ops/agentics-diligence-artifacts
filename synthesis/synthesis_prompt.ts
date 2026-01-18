/**
 * Hard-coded McKinsey-style prompt for executive synthesis.
 *
 * Constraints:
 * - Never invent data
 * - Always issue a recommendation
 * - Use calm, executive language
 * - Avoid hype, emojis, or "AI" phrasing
 */

import {
  DecisionInput,
  ExtractedEvidence,
  RecommendationDisposition,
} from './decision_input';

export const SYNTHESIS_SYSTEM_PROMPT = `You are a senior strategy consultant preparing a decision memo for an executive board. Your role is to enhance deterministically-extracted data with executive context and actionable insights.

Critical guidelines:
1. NEVER invent, fabricate, or extrapolate data beyond what is provided
2. The recommendation disposition (APPROVE/DEFER/REJECT) has already been determined - do not change it
3. Use measured, professional language appropriate for board-level communication
4. Avoid technical jargon unless necessary; when used, provide brief context
5. Do not use emojis, exclamation marks, or promotional language
6. Do not reference yourself, the analysis process, or artificial intelligence
7. Present findings as factual observations from the evaluation data
8. Quantify impacts where data supports it; qualify with "based on available data" when appropriate
9. Acknowledge limitations and assumptions explicitly

You will enhance the following sections ONLY:
- materiality: One sentence quantifying business impact (revenue, cost, risk, or strategic position)
- urgency_driver: One sentence explaining why this decision cannot be deferred
- rationale_bullets: 3-5 evidence-backed bullets connecting findings to business outcomes
- erp_resolutions: 2-3 specific system/workflow/policy changes required
- next_actions: Categorized actions (approve, defer, reject) with owners and timelines

Your output must be valid JSON. Do not include markdown formatting or code blocks.`;

/**
 * Legacy user prompt builder for backward compatibility.
 */
export function buildUserPrompt(
  objective: string,
  command: string,
  rawOutput: unknown,
  precedent?: unknown
): string {
  const outputStr = typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput, null, 2);
  const precedentStr = precedent
    ? `\n\nPrecedent data for comparison:\n${typeof precedent === 'string' ? precedent : JSON.stringify(precedent, null, 2)}`
    : '\n\nNo precedent data available for comparison.';

  return `Analyze the following evaluation data and produce an executive decision summary.

Business Objective: ${objective}

Evaluation Command: ${command}

Evaluation Output:
${outputStr}
${precedentStr}

Respond with valid JSON only. Do not include markdown formatting or code blocks.`;
}

/**
 * Builds canonical prompt for Executive Decision Packet enhancement.
 * The LLM enhances deterministically-extracted data, it does NOT determine the recommendation.
 */
export function buildCanonicalPrompt(
  input: DecisionInput,
  evidence: ExtractedEvidence,
  disposition: RecommendationDisposition,
  framing: {
    decision_required: string;
    alternatives: Array<{ path: string; description: string }>;
    inaction_scenario: string;
  }
): string {
  const evidenceSummary = buildEvidenceSummary(evidence);

  return `Enhance the following deterministically-extracted decision packet with executive context.

IMPORTANT: The recommendation disposition is FIXED as "${disposition}". Do not change or contradict it.

## Decision Context

Business Objective: ${input.objective}
Command Executed: ${input.command}
Plan Type: ${input.plan_type || 'assessment'}

## Decision Framing (Already Determined)

Decision Required: ${framing.decision_required}

Alternatives Considered:
${framing.alternatives.map(a => `- ${a.path}: ${a.description}`).join('\n')}

Inaction Scenario: ${framing.inaction_scenario}

## Extracted Evidence Summary

${evidenceSummary}

## Your Task

Provide enhancement JSON with ONLY these fields:

{
  "materiality": "One sentence quantifying business impact - must reference evidence above",
  "urgency_driver": "One sentence explaining time sensitivity - do not invent deadlines",
  "rationale_bullets": [
    {
      "finding": "Specific finding from evidence",
      "evidence_source": "Which simulation/metric this came from",
      "business_outcome": "What this means for the business"
    }
  ],
  "erp_resolutions": [
    {
      "type": "system|workflow|policy",
      "action": "Specific action to take",
      "target": "Which system or process"
    }
  ],
  "next_actions": {
    "approve": [{"action": "...", "owner": "Role not name", "timeline": "Relative timeframe"}],
    "defer": [{"action": "...", "pending": "What must be resolved", "revisit_date": "..."}],
    "reject": [{"alternative": "...", "reason": "..."}]
  }
}

Rules:
- Each rationale bullet MUST reference evidence from the summary above
- Do not invent metrics, deadlines, or specifics not in the evidence
- If data is insufficient, say "Based on available data" or "Data not provided"
- erp_resolutions should be realistic system changes, not generic statements
- next_actions should populate ONLY the category matching the disposition "${disposition}"

Respond with valid JSON only.`;
}

/**
 * Builds a summary of extracted evidence for the LLM context.
 */
function buildEvidenceSummary(evidence: ExtractedEvidence): string {
  const sections: string[] = [];

  // Policy violations
  if (evidence.policy_violations.length > 0) {
    const critical = evidence.policy_violations.filter(v => v.severity === 'critical').length;
    const high = evidence.policy_violations.filter(v => v.severity === 'high').length;
    const medium = evidence.policy_violations.filter(v => v.severity === 'medium').length;
    const low = evidence.policy_violations.filter(v => v.severity === 'low').length;

    sections.push(`### Policy Violations
Total: ${evidence.policy_violations.length} (${critical} critical, ${high} high, ${medium} medium, ${low} low)
${evidence.policy_violations.slice(0, 5).map(v => `- [${v.severity.toUpperCase()}] ${v.rule}: ${v.description}`).join('\n')}`);
  } else {
    sections.push('### Policy Violations\nNone detected in simulation.');
  }

  // Cost variances
  if (evidence.cost_variances.length > 0) {
    const totalVariance = evidence.cost_variances.reduce((sum, c) => sum + c.variance, 0);
    const currency = evidence.cost_variances[0]?.currency || 'USD';

    sections.push(`### Cost Variances
Total Variance: ${currency}${totalVariance.toLocaleString()}
${evidence.cost_variances.map(c => `- ${c.category}: ${c.currency}${c.variance.toLocaleString()} (${c.variancePercent.toFixed(1)}%)`).join('\n')}`);
  } else {
    sections.push('### Cost Variances\nNo cost data provided in simulation.');
  }

  // Failure rates
  if (evidence.failure_rates.length > 0) {
    const breached = evidence.failure_rates.filter(f => f.breached);

    sections.push(`### Failure Rates
Components Analyzed: ${evidence.failure_rates.length}
Threshold Breaches: ${breached.length}
${evidence.failure_rates.map(f => `- ${f.component}: ${(f.rate * 100).toFixed(2)}% (threshold: ${(f.threshold * 100).toFixed(2)}%)${f.breached ? ' [BREACHED]' : ''}`).join('\n')}`);
  } else {
    sections.push('### Failure Rates\nNo failure rate data provided in simulation.');
  }

  // Latency impacts
  if (evidence.latency_impacts.length > 0) {
    const avgDegradation = evidence.latency_impacts.reduce((sum, l) => sum + l.degradation_percent, 0) / evidence.latency_impacts.length;

    sections.push(`### Latency Impacts
Operations Analyzed: ${evidence.latency_impacts.length}
Average Degradation: ${avgDegradation.toFixed(1)}%
${evidence.latency_impacts.map(l => `- ${l.operation}: p95=${l.p95}${l.unit} (baseline: ${l.baseline_p95}${l.unit}, degradation: ${l.degradation_percent.toFixed(1)}%)`).join('\n')}`);
  } else {
    sections.push('### Latency Impacts\nNo latency data provided in simulation.');
  }

  // Binding constraints
  if (evidence.binding_constraints.length > 0) {
    const binding = evidence.binding_constraints.filter(c => c.binding);

    sections.push(`### Binding Constraints
Total Constraints: ${evidence.binding_constraints.length}
Currently Binding: ${binding.length}
${evidence.binding_constraints.map(c => `- [${c.type.toUpperCase()}] ${c.name}: ${c.current} / ${c.limit}${c.binding ? ' [BINDING]' : ''}`).join('\n')}`);
  } else {
    sections.push('### Binding Constraints\nNo explicit constraints defined in simulation.');
  }

  // Micro distributions
  if (evidence.micro_distributions.length > 0) {
    sections.push(`### Statistical Distributions
${evidence.micro_distributions.map(d => `- ${d.metric}: mean=${d.distribution.mean.toFixed(2)}${d.unit}, median=${d.distribution.median.toFixed(2)}${d.unit}, stdDev=${d.distribution.stdDev.toFixed(2)} (n=${d.sampleSize})`).join('\n')}`);
  } else {
    sections.push('### Statistical Distributions\nNo distribution data provided in simulation.');
  }

  return sections.join('\n\n');
}
