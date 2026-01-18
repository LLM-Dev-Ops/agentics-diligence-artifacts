/**
 * Synthesizer module for LLM orchestration.
 * Produces canonical Executive Decision Packet with deterministic extraction.
 *
 * Constraints:
 * - Do NOT hallucinate data
 * - Do NOT infer beyond simulation outputs
 * - Prefer explicit "unknown" over assumption
 */

import {
  DecisionInput,
  SynthesisResult,
  LegacySynthesisResult,
  ExtractedEvidence,
} from './decision_input';
import {
  SYNTHESIS_SYSTEM_PROMPT,
  buildUserPrompt,
  buildCanonicalPrompt,
} from './synthesis_prompt';
import {
  extractEvidence,
  extractDecisionFraming,
  determineRecommendation,
  buildRecommendationStatement,
  extractRisksAndTradeoffs,
  detectConstraints,
  generateDecisionDisplacement,
  buildMicroMacroNarrative,
} from './extraction';
import { enforceExecutiveQuality } from './language_quality';

interface LLMConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Calls an OpenAI/Claude-compatible LLM endpoint.
 */
async function callLLM(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = config.model || 'gpt-4o';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2, // Lower temperature for more deterministic output
      max_tokens: 3000, // Increased for canonical structure
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as LLMResponse;
  return data.choices[0]?.message?.content || '';
}

/**
 * Parses LLM response for executive context enhancement.
 */
function parseLLMEnhancement(raw: string): {
  materiality?: string;
  urgency_driver?: string;
  rationale_bullets?: Array<{
    finding: string;
    evidence_source: string;
    business_outcome: string;
  }>;
  erp_resolutions?: Array<{
    type: 'system' | 'workflow' | 'policy';
    action: string;
    target: string;
  }>;
  next_actions?: {
    approve: Array<{ action: string; owner: string; timeline: string }>;
    defer: Array<{ action: string; pending: string; revisit_date: string }>;
    reject: Array<{ alternative: string; reason: string }>;
  };
} {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

/**
 * Calculates data completeness based on extracted evidence.
 */
function calculateDataCompleteness(
  evidence: ExtractedEvidence
): 'complete' | 'partial' | 'minimal' {
  let score = 0;
  const maxScore = 6;

  if (evidence.policy_violations.length > 0 || evidence.binding_constraints.some(c => c.type === 'policy')) score++;
  if (evidence.cost_variances.length > 0) score++;
  if (evidence.failure_rates.length > 0) score++;
  if (evidence.latency_impacts.length > 0) score++;
  if (evidence.binding_constraints.length > 0) score++;
  if (evidence.micro_distributions.length > 0) score++;

  if (score >= 5) return 'complete';
  if (score >= 2) return 'partial';
  return 'minimal';
}

/**
 * Calculates confidence level based on evidence quality.
 */
function calculateConfidenceLevel(
  evidence: ExtractedEvidence,
  completeness: 'complete' | 'partial' | 'minimal'
): 'high' | 'medium' | 'low' {
  if (completeness === 'minimal') return 'low';

  // Check sample sizes
  const hasSufficientSamples =
    evidence.failure_rates.some(f => f.sampleSize > 100) ||
    evidence.micro_distributions.some(d => d.sampleSize > 100);

  if (completeness === 'complete' && hasSufficientSamples) return 'high';
  if (completeness === 'complete' || hasSufficientSamples) return 'medium';
  return 'low';
}

/**
 * Generates assumptions based on what data is missing.
 */
function generateAssumptions(
  evidence: ExtractedEvidence,
  completeness: 'complete' | 'partial' | 'minimal'
): string[] {
  const assumptions: string[] = [];

  if (evidence.cost_variances.length === 0) {
    assumptions.push('Cost data not provided; financial impact based on available metrics only');
  }
  if (evidence.failure_rates.length === 0) {
    assumptions.push('Failure rate data not provided; reliability assessment based on available evidence');
  }
  if (evidence.micro_distributions.length === 0) {
    assumptions.push('Statistical distributions not provided; variance analysis limited');
  }
  if (evidence.binding_constraints.filter(c => c.type === 'regulatory').length === 0) {
    assumptions.push('Regulatory constraints not explicitly defined in simulation');
  }
  if (completeness === 'partial' || completeness === 'minimal') {
    assumptions.push('Analysis based on incomplete simulation data; conclusions subject to revision with additional evidence');
  }

  return assumptions;
}

/**
 * Main synthesis function - produces canonical Executive Decision Packet.
 * Uses deterministic extraction with LLM enhancement for context sections.
 */
export async function synthesize(
  input: DecisionInput,
  config?: LLMConfig
): Promise<SynthesisResult> {
  const llmConfig: LLMConfig = config || {
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
  };

  // Step 1: Extract evidence deterministically from simulation output
  const evidence = extractEvidence(input.raw_output);

  // Step 2: Extract decision framing from command/objective/plan_type
  const framing = extractDecisionFraming(input);

  // Step 3: Determine recommendation (APPROVE/DEFER/REJECT only)
  const disposition = determineRecommendation(evidence);
  const recommendationStatement = buildRecommendationStatement(
    disposition,
    evidence,
    input.objective
  );

  // Step 4: Extract risks and tradeoffs from evidence
  const risksAndTradeoffs = extractRisksAndTradeoffs(evidence);

  // Step 5: Detect constraints
  const constraints = detectConstraints(evidence);

  // Step 6: Generate decision displacement
  const displacement = generateDecisionDisplacement(input.plan_type, input.objective);

  // Step 7: Build micro → macro narrative
  const microMacro = buildMicroMacroNarrative(evidence, input.objective);

  // Step 8: Calculate metadata
  const completeness = calculateDataCompleteness(evidence);
  const confidenceLevel = calculateConfidenceLevel(evidence, completeness);
  const assumptions = generateAssumptions(evidence, completeness);

  // Step 9: Call LLM for context enhancement (materiality, urgency, rationale, actions)
  let llmEnhancement: ReturnType<typeof parseLLMEnhancement> = {};
  let rawResponse: string | undefined;

  if (llmConfig.apiKey) {
    try {
      const messages: LLMMessage[] = [
        { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildCanonicalPrompt(input, evidence, disposition, framing),
        },
      ];

      rawResponse = await callLLM(llmConfig, messages);
      llmEnhancement = parseLLMEnhancement(rawResponse);
    } catch (err) {
      console.error('LLM enhancement failed, using deterministic output only:', err);
    }
  }

  // Step 10: Assemble canonical structure
  const result: SynthesisResult = {
    executive_context: {
      decision_domain: input.objective,
      materiality: llmEnhancement.materiality || 'See simulation metrics for quantified impact',
      urgency_driver: llmEnhancement.urgency_driver || 'As determined by organizational timeline',
    },
    decision_framing: {
      decision_required: framing.decision_required,
      alternatives_considered: framing.alternatives,
      inaction_scenario: framing.inaction_scenario,
    },
    recommendation: {
      disposition,
      statement: recommendationStatement,
      rationale_bullets: llmEnhancement.rationale_bullets || buildDefaultRationale(evidence, disposition),
    },
    risks_and_tradeoffs: risksAndTradeoffs,
    constraints,
    erp_resolutions: llmEnhancement.erp_resolutions || buildDefaultResolutions(disposition, input.plan_type),
    decision_displacement: displacement,
    micro_macro_narrative: microMacro,
    next_actions: llmEnhancement.next_actions || buildDefaultActions(disposition, input.objective),
    metadata: {
      generated_at: new Date().toISOString(),
      data_completeness: completeness,
      confidence_level: confidenceLevel,
      assumptions,
    },
    raw_response: rawResponse,
  };

  // Step 11: Enforce executive language quality (board-ready output)
  const qualityEnforcedResult = enforceExecutiveQuality(result);

  return qualityEnforcedResult;
}

/**
 * Builds default rationale bullets from evidence.
 */
function buildDefaultRationale(
  evidence: ExtractedEvidence,
  disposition: 'APPROVE' | 'DEFER' | 'REJECT'
): Array<{ finding: string; evidence_source: string; business_outcome: string }> {
  const bullets: Array<{ finding: string; evidence_source: string; business_outcome: string }> = [];

  // Add violation-based rationale
  if (evidence.policy_violations.length > 0) {
    const critical = evidence.policy_violations.filter(v => v.severity === 'critical').length;
    const high = evidence.policy_violations.filter(v => v.severity === 'high').length;

    bullets.push({
      finding: `${evidence.policy_violations.length} policy violations identified (${critical} critical, ${high} high)`,
      evidence_source: 'Policy compliance simulation',
      business_outcome: disposition === 'REJECT'
        ? 'Unacceptable risk exposure requiring remediation'
        : 'Manageable with documented exceptions',
    });
  }

  // Add failure rate rationale
  if (evidence.failure_rates.length > 0) {
    const breached = evidence.failure_rates.filter(f => f.breached).length;
    bullets.push({
      finding: `${breached}/${evidence.failure_rates.length} components exceed failure thresholds`,
      evidence_source: 'Reliability simulation',
      business_outcome: breached > 0
        ? 'Requires monitoring and potential intervention'
        : 'System operates within acceptable parameters',
    });
  }

  // Add latency rationale
  if (evidence.latency_impacts.length > 0) {
    const avgDegradation = evidence.latency_impacts.reduce(
      (sum, l) => sum + l.degradation_percent, 0
    ) / evidence.latency_impacts.length;

    bullets.push({
      finding: `Average latency degradation: ${avgDegradation.toFixed(1)}%`,
      evidence_source: 'Performance simulation',
      business_outcome: avgDegradation > 25
        ? 'User experience impact requires attention'
        : 'Performance within acceptable bounds',
    });
  }

  // Ensure at least one bullet
  if (bullets.length === 0) {
    bullets.push({
      finding: 'Simulation completed without critical findings',
      evidence_source: 'Automated evaluation',
      business_outcome: 'Proceed with standard monitoring',
    });
  }

  return bullets;
}

/**
 * Builds default ERP resolutions based on disposition.
 */
function buildDefaultResolutions(
  disposition: 'APPROVE' | 'DEFER' | 'REJECT',
  planType?: string
): Array<{ type: 'system' | 'workflow' | 'policy'; action: string; target: string }> {
  switch (disposition) {
    case 'APPROVE':
      return [
        { type: 'workflow', action: 'Initiate deployment approval workflow', target: 'Change management system' },
        { type: 'system', action: 'Configure monitoring dashboards', target: 'Observability platform' },
      ];
    case 'DEFER':
      return [
        { type: 'workflow', action: 'Create follow-up review task', target: 'Project management system' },
        { type: 'policy', action: 'Document deferral rationale', target: 'Decision log' },
      ];
    case 'REJECT':
      return [
        { type: 'workflow', action: 'Route to remediation queue', target: 'Issue tracking system' },
        { type: 'policy', action: 'Update risk register', target: 'Risk management system' },
      ];
  }
}

/**
 * Builds default next actions based on disposition.
 */
function buildDefaultActions(
  disposition: 'APPROVE' | 'DEFER' | 'REJECT',
  objective: string
): {
  approve: Array<{ action: string; owner: string; timeline: string }>;
  defer: Array<{ action: string; pending: string; revisit_date: string }>;
  reject: Array<{ alternative: string; reason: string }>;
} {
  switch (disposition) {
    case 'APPROVE':
      return {
        approve: [
          { action: 'Execute proposed plan', owner: 'Designated approver', timeline: 'Per project schedule' },
          { action: 'Activate monitoring', owner: 'Operations team', timeline: 'Upon deployment' },
        ],
        defer: [],
        reject: [],
      };
    case 'DEFER':
      return {
        approve: [],
        defer: [
          { action: 'Address identified blockers', pending: 'Resolution of binding constraints', revisit_date: 'TBD by stakeholders' },
        ],
        reject: [],
      };
    case 'REJECT':
      return {
        approve: [],
        defer: [],
        reject: [
          { alternative: 'Current proposal', reason: 'Does not meet acceptance criteria per simulation' },
        ],
      };
  }
}

/**
 * Legacy synthesis function for backward compatibility.
 */
export async function synthesizeLegacy(
  input: DecisionInput,
  config?: LLMConfig
): Promise<LegacySynthesisResult> {
  const llmConfig: LLMConfig = config || {
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
  };

  if (!llmConfig.apiKey) {
    throw new Error('No API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(input.objective, input.command, input.raw_output, input.precedent) },
  ];

  const rawResponse = await callLLM(llmConfig, messages);

  // Parse legacy format
  let parsed: Record<string, unknown>;
  try {
    const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse LLM response as JSON: ${rawResponse.substring(0, 200)}...`);
  }

  return {
    sections: {
      objective: String(parsed.objective || 'Not specified'),
      evaluated: String(parsed.evaluated || 'Not specified'),
      findings: {
        financial_impact: String(
          parsed.findings && typeof parsed.findings === 'object'
            ? (parsed.findings as Record<string, unknown>).financial_impact || 'Not assessed'
            : 'Not assessed'
        ),
        risk_exposure: String(
          parsed.findings && typeof parsed.findings === 'object'
            ? (parsed.findings as Record<string, unknown>).risk_exposure || 'Not assessed'
            : 'Not assessed'
        ),
        system_complexity: String(
          parsed.findings && typeof parsed.findings === 'object'
            ? (parsed.findings as Record<string, unknown>).system_complexity || 'Not assessed'
            : 'Not assessed'
        ),
      },
      comparative_scenarios: String(parsed.comparative_scenarios || 'No comparison available'),
      recommendation: String(parsed.recommendation || 'Insufficient data for recommendation'),
      confidence_assumptions: String(parsed.confidence_assumptions || 'Not specified'),
    },
    raw_response: rawResponse,
  };
}
