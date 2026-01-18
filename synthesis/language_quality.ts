/**
 * Executive Language Quality Enforcement
 *
 * Enforces McKinsey-grade language quality across all synthesis outputs.
 * Output must be suitable for board deck verbatim insertion.
 *
 * Standards:
 * - No casual language
 * - No emojis
 * - No uncertainty hedging
 * - No internal jargon
 * - Clear declarative sentences
 * - Active voice
 * - No speculative phrasing
 * - Every statement answers "so what?"
 */

// ============================================================================
// PROHIBITED PATTERNS
// ============================================================================

/** Patterns that indicate casual or unprofessional language */
const CASUAL_PATTERNS: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
  { pattern: /\bbasically\b/gi, replacement: '', reason: 'Filler word' },
  { pattern: /\bactually\b/gi, replacement: '', reason: 'Filler word' },
  { pattern: /\bjust\b/gi, replacement: '', reason: 'Minimizing word' },
  { pattern: /\breally\b/gi, replacement: '', reason: 'Intensifier without substance' },
  { pattern: /\bvery\b/gi, replacement: '', reason: 'Weak intensifier' },
  { pattern: /\bquite\b/gi, replacement: '', reason: 'Vague qualifier' },
  { pattern: /\bpretty\b(?!\s+much)/gi, replacement: '', reason: 'Casual qualifier' },
  { pattern: /\bkind of\b/gi, replacement: '', reason: 'Hedging phrase' },
  { pattern: /\bsort of\b/gi, replacement: '', reason: 'Hedging phrase' },
  { pattern: /\ba lot\b/gi, replacement: 'significantly', reason: 'Informal quantifier' },
  { pattern: /\btons of\b/gi, replacement: 'substantial', reason: 'Informal quantifier' },
  { pattern: /\bgonna\b/gi, replacement: 'will', reason: 'Informal contraction' },
  { pattern: /\bwanna\b/gi, replacement: 'want to', reason: 'Informal contraction' },
  { pattern: /\bgotta\b/gi, replacement: 'must', reason: 'Informal contraction' },
  { pattern: /\bkinda\b/gi, replacement: '', reason: 'Informal contraction' },
  { pattern: /\bsorta\b/gi, replacement: '', reason: 'Informal contraction' },
  { pattern: /\betc\.?\b/gi, replacement: 'and related items', reason: 'Lazy enumeration' },
  { pattern: /\band so on\b/gi, replacement: '', reason: 'Lazy enumeration' },
  { pattern: /\band stuff\b/gi, replacement: '', reason: 'Casual filler' },
  { pattern: /\bthings like\b/gi, replacement: 'such as', reason: 'Casual phrasing' },
];

/** Uncertainty hedging that undermines authority */
const HEDGING_PATTERNS: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
  { pattern: /\bI think\b/gi, replacement: 'Analysis indicates', reason: 'Personal opinion hedge' },
  { pattern: /\bI believe\b/gi, replacement: 'Evidence suggests', reason: 'Personal opinion hedge' },
  { pattern: /\bwe think\b/gi, replacement: 'Analysis indicates', reason: 'Opinion hedge' },
  { pattern: /\bwe believe\b/gi, replacement: 'Evidence suggests', reason: 'Opinion hedge' },
  { pattern: /\bit seems\b/gi, replacement: 'Data indicates', reason: 'Uncertainty hedge' },
  { pattern: /\bit appears\b/gi, replacement: 'Evidence shows', reason: 'Uncertainty hedge' },
  { pattern: /\bprobably\b/gi, replacement: 'likely', reason: 'Weak probability' },
  { pattern: /\bmaybe\b/gi, replacement: 'potentially', reason: 'Uncertain modal' },
  { pattern: /\bperhaps\b/gi, replacement: 'potentially', reason: 'Uncertain modal' },
  { pattern: /\bmight\b/gi, replacement: 'may', reason: 'Weak modal' },
  { pattern: /\bcould potentially\b/gi, replacement: 'may', reason: 'Redundant hedging' },
  { pattern: /\bmay potentially\b/gi, replacement: 'may', reason: 'Redundant hedging' },
  { pattern: /\bpossibly\b/gi, replacement: '', reason: 'Unnecessary hedge' },
  { pattern: /\bseemingly\b/gi, replacement: '', reason: 'Uncertainty hedge' },
  { pattern: /\bapparently\b/gi, replacement: '', reason: 'Uncertainty hedge' },
  { pattern: /\bin my opinion\b/gi, replacement: '', reason: 'Subjective qualifier' },
  { pattern: /\bfrom my perspective\b/gi, replacement: '', reason: 'Subjective qualifier' },
  { pattern: /\bto some extent\b/gi, replacement: '', reason: 'Vague qualifier' },
  { pattern: /\bto a certain degree\b/gi, replacement: '', reason: 'Vague qualifier' },
];

/** Speculative phrasing that lacks commitment */
const SPECULATIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
  { pattern: /\bif everything goes well\b/gi, replacement: 'under expected conditions', reason: 'Speculative' },
  { pattern: /\bhopefully\b/gi, replacement: '', reason: 'Wishful thinking' },
  { pattern: /\bfingers crossed\b/gi, replacement: '', reason: 'Informal speculation' },
  { pattern: /\bwith any luck\b/gi, replacement: '', reason: 'Speculative' },
  { pattern: /\bwe'll see\b/gi, replacement: 'subsequent analysis will determine', reason: 'Passive uncertainty' },
  { pattern: /\btime will tell\b/gi, replacement: 'performance monitoring will validate', reason: 'Passive uncertainty' },
  { pattern: /\bonly time will tell\b/gi, replacement: 'ongoing monitoring will validate', reason: 'Passive uncertainty' },
  { pattern: /\bit remains to be seen\b/gi, replacement: 'pending validation', reason: 'Passive uncertainty' },
];

/** Internal jargon that obscures meaning */
const JARGON_PATTERNS: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
  { pattern: /\bsynergize\b/gi, replacement: 'combine', reason: 'Corporate jargon' },
  { pattern: /\bsynergies\b/gi, replacement: 'efficiencies', reason: 'Corporate jargon' },
  { pattern: /\bleverage\b/gi, replacement: 'use', reason: 'Overused jargon' },
  { pattern: /\butilize\b/gi, replacement: 'use', reason: 'Unnecessarily complex' },
  { pattern: /\boptimize\b/gi, replacement: 'improve', reason: 'Often vague' },
  { pattern: /\bstreamline\b/gi, replacement: 'simplify', reason: 'Corporate jargon' },
  { pattern: /\bactionable\b/gi, replacement: 'specific', reason: 'Corporate jargon' },
  { pattern: /\bimpactful\b/gi, replacement: 'significant', reason: 'Corporate jargon' },
  { pattern: /\bscalable\b/gi, replacement: 'expandable', reason: 'Tech jargon' },
  { pattern: /\bbest-in-class\b/gi, replacement: 'leading', reason: 'Marketing speak' },
  { pattern: /\bworld-class\b/gi, replacement: 'high-quality', reason: 'Marketing speak' },
  { pattern: /\bcutting-edge\b/gi, replacement: 'advanced', reason: 'Marketing speak' },
  { pattern: /\bstate-of-the-art\b/gi, replacement: 'current', reason: 'Marketing speak' },
  { pattern: /\bgame-changing\b/gi, replacement: 'significant', reason: 'Hyperbole' },
  { pattern: /\bdisruptive\b/gi, replacement: 'transformative', reason: 'Overused' },
  { pattern: /\binnovative\b/gi, replacement: 'new', reason: 'Often meaningless' },
  { pattern: /\bholistic\b/gi, replacement: 'comprehensive', reason: 'Corporate jargon' },
  { pattern: /\bparadigm shift\b/gi, replacement: 'fundamental change', reason: 'Cliche' },
  { pattern: /\bmoving forward\b/gi, replacement: '', reason: 'Filler phrase' },
  { pattern: /\bgoing forward\b/gi, replacement: '', reason: 'Filler phrase' },
  { pattern: /\bat the end of the day\b/gi, replacement: 'ultimately', reason: 'Cliche' },
  { pattern: /\blow-hanging fruit\b/gi, replacement: 'immediate opportunities', reason: 'Cliche' },
  { pattern: /\bboil the ocean\b/gi, replacement: 'overextend scope', reason: 'Cliche' },
  { pattern: /\bdrink the kool-aid\b/gi, replacement: 'accept uncritically', reason: 'Inappropriate' },
  { pattern: /\bpush the envelope\b/gi, replacement: 'exceed limits', reason: 'Cliche' },
  { pattern: /\bthink outside the box\b/gi, replacement: 'consider alternatives', reason: 'Cliche' },
  { pattern: /\btouch base\b/gi, replacement: 'discuss', reason: 'Corporate jargon' },
  { pattern: /\bping\b/gi, replacement: 'contact', reason: 'Tech jargon' },
  { pattern: /\bloop in\b/gi, replacement: 'include', reason: 'Corporate jargon' },
  { pattern: /\bbandwidth\b(?!.*network)/gi, replacement: 'capacity', reason: 'Misused tech term' },
  { pattern: /\bdeep dive\b/gi, replacement: 'detailed analysis', reason: 'Corporate jargon' },
  { pattern: /\bdrill down\b/gi, replacement: 'examine in detail', reason: 'Corporate jargon' },
];

/** Emoji detection - board decks never have emojis */
const EMOJI_PATTERN = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]/gu;

/** Passive voice patterns that weaken statements */
const PASSIVE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bwas\s+\w+ed\b/gi, reason: 'Passive voice' },
  { pattern: /\bwere\s+\w+ed\b/gi, reason: 'Passive voice' },
  { pattern: /\bis\s+being\s+\w+ed\b/gi, reason: 'Passive voice' },
  { pattern: /\bhas\s+been\s+\w+ed\b/gi, reason: 'Passive voice' },
  { pattern: /\bhave\s+been\s+\w+ed\b/gi, reason: 'Passive voice' },
  { pattern: /\bwill\s+be\s+\w+ed\b/gi, reason: 'Passive voice' },
  { pattern: /\bshould\s+be\s+\w+ed\b/gi, reason: 'Passive voice' },
  { pattern: /\bcan\s+be\s+\w+ed\b/gi, reason: 'Passive voice' },
];

/** Vague phrases that need specificity */
const VAGUE_PHRASES: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
  { pattern: /\bsignificant improvement\b/gi, replacement: '[X]% improvement', reason: 'Quantify the improvement' },
  { pattern: /\bsubstantial increase\b/gi, replacement: '[X]% increase', reason: 'Quantify the increase' },
  { pattern: /\bsoon\b/gi, replacement: 'by [date]', reason: 'Specify timeline' },
  { pattern: /\bin the near future\b/gi, replacement: 'within [timeframe]', reason: 'Specify timeline' },
  { pattern: /\brecently\b/gi, replacement: 'in [month/quarter]', reason: 'Specify timeframe' },
  { pattern: /\bvarious\b/gi, replacement: '[specific list]', reason: 'Be specific' },
  { pattern: /\bnumerous\b/gi, replacement: '[specific count]', reason: 'Quantify' },
  { pattern: /\bseveral\b/gi, replacement: '[specific count]', reason: 'Quantify' },
  { pattern: /\bmany\b/gi, replacement: '[specific count]', reason: 'Quantify' },
  { pattern: /\bsome\b/gi, replacement: '[specific count or percentage]', reason: 'Quantify' },
  { pattern: /\bmost\b/gi, replacement: '[specific percentage]', reason: 'Quantify' },
  { pattern: /\bfew\b/gi, replacement: '[specific count]', reason: 'Quantify' },
];

// ============================================================================
// QUALITY VIOLATION TYPES
// ============================================================================

export interface QualityViolation {
  type: 'casual' | 'hedging' | 'speculative' | 'jargon' | 'emoji' | 'passive' | 'vague';
  original: string;
  suggestion: string;
  reason: string;
  position: number;
}

export interface QualityReport {
  passed: boolean;
  score: number; // 0-100
  violations: QualityViolation[];
  rewrittenText: string;
  metrics: {
    totalWords: number;
    violationCount: number;
    violationDensity: number;
    passiveVoiceCount: number;
    averageSentenceLength: number;
  };
}

// ============================================================================
// QUALITY VALIDATION
// ============================================================================

/**
 * Validates text against executive language quality standards.
 * Returns detailed report with violations and suggestions.
 */
export function validateQuality(text: string): QualityReport {
  const violations: QualityViolation[] = [];
  let rewrittenText = text;

  // Check for emojis
  const emojiMatches = text.matchAll(EMOJI_PATTERN);
  for (const match of emojiMatches) {
    violations.push({
      type: 'emoji',
      original: match[0],
      suggestion: '',
      reason: 'Emojis are not appropriate for board-level communication',
      position: match.index || 0,
    });
    rewrittenText = rewrittenText.replace(match[0], '');
  }

  // Check casual patterns
  for (const { pattern, replacement, reason } of CASUAL_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      violations.push({
        type: 'casual',
        original: match[0],
        suggestion: replacement,
        reason,
        position: match.index || 0,
      });
    }
    rewrittenText = rewrittenText.replace(pattern, replacement);
  }

  // Check hedging patterns
  for (const { pattern, replacement, reason } of HEDGING_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      violations.push({
        type: 'hedging',
        original: match[0],
        suggestion: replacement,
        reason,
        position: match.index || 0,
      });
    }
    rewrittenText = rewrittenText.replace(pattern, replacement);
  }

  // Check speculative patterns
  for (const { pattern, replacement, reason } of SPECULATIVE_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      violations.push({
        type: 'speculative',
        original: match[0],
        suggestion: replacement,
        reason,
        position: match.index || 0,
      });
    }
    rewrittenText = rewrittenText.replace(pattern, replacement);
  }

  // Check jargon patterns
  for (const { pattern, replacement, reason } of JARGON_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      violations.push({
        type: 'jargon',
        original: match[0],
        suggestion: replacement,
        reason,
        position: match.index || 0,
      });
    }
    rewrittenText = rewrittenText.replace(pattern, replacement);
  }

  // Check passive voice (warning only, not auto-replaced)
  let passiveVoiceCount = 0;
  for (const { pattern, reason } of PASSIVE_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      passiveVoiceCount++;
      violations.push({
        type: 'passive',
        original: match[0],
        suggestion: 'Consider active voice',
        reason,
        position: match.index || 0,
      });
    }
  }

  // Check vague phrases (warning with template, not auto-replaced)
  for (const { pattern, replacement, reason } of VAGUE_PHRASES) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      violations.push({
        type: 'vague',
        original: match[0],
        suggestion: replacement,
        reason,
        position: match.index || 0,
      });
    }
  }

  // Clean up multiple spaces and trim
  rewrittenText = rewrittenText.replace(/\s+/g, ' ').trim();

  // Calculate metrics
  const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const averageSentenceLength = totalWords / Math.max(sentences.length, 1);

  const metrics = {
    totalWords,
    violationCount: violations.length,
    violationDensity: violations.length / Math.max(totalWords, 1),
    passiveVoiceCount,
    averageSentenceLength,
  };

  // Calculate score (100 = perfect)
  const baseScore = 100;
  const casualPenalty = violations.filter(v => v.type === 'casual').length * 2;
  const hedgingPenalty = violations.filter(v => v.type === 'hedging').length * 3;
  const speculativePenalty = violations.filter(v => v.type === 'speculative').length * 4;
  const jargonPenalty = violations.filter(v => v.type === 'jargon').length * 2;
  const emojiPenalty = violations.filter(v => v.type === 'emoji').length * 10;
  const passivePenalty = passiveVoiceCount * 1;
  const vaguePenalty = violations.filter(v => v.type === 'vague').length * 2;

  const totalPenalty = casualPenalty + hedgingPenalty + speculativePenalty +
    jargonPenalty + emojiPenalty + passivePenalty + vaguePenalty;

  const score = Math.max(0, baseScore - totalPenalty);

  return {
    passed: score >= 80, // 80+ is board-ready
    score,
    violations,
    rewrittenText,
    metrics,
  };
}

/**
 * Enforces quality by rewriting text to meet standards.
 * Returns cleaned text ready for board presentation.
 */
export function enforceQuality(text: string): string {
  const report = validateQuality(text);
  return report.rewrittenText;
}

// ============================================================================
// SENTENCE-LEVEL ENFORCEMENT
// ============================================================================

/**
 * Ensures sentences are declarative and answer "so what?"
 */
export function enforceDeclarativeSentences(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const processed: string[] = [];

  for (let sentence of sentences) {
    sentence = sentence.trim();
    if (!sentence) continue;

    // Remove question marks from statements (executive decks don't ask questions)
    if (sentence.endsWith('?') && !sentence.toLowerCase().startsWith('what if')) {
      sentence = sentence.slice(0, -1) + '.';
    }

    // Capitalize first letter
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

    processed.push(sentence);
  }

  return processed.join(' ');
}

/**
 * Tightens recommendations to be direct and actionable.
 */
export function tightenRecommendation(text: string): string {
  let result = text;

  // Remove weak openings
  const weakOpenings = [
    /^It is recommended that\s+/i,
    /^We recommend that\s+/i,
    /^It would be advisable to\s+/i,
    /^Consider\s+/i,
    /^You may want to\s+/i,
    /^It might be worth\s+/i,
    /^One option would be to\s+/i,
  ];

  for (const pattern of weakOpenings) {
    if (pattern.test(result)) {
      result = result.replace(pattern, '');
      // Capitalize first letter after removal
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
  }

  // Ensure ends with period
  if (!result.endsWith('.') && !result.endsWith('!')) {
    result += '.';
  }

  return result;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Processes all text fields in an object, enforcing quality.
 */
export function enforceQualityOnObject<T extends Record<string, unknown>>(
  obj: T
): T {
  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = enforceQuality(value);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map(item => {
        if (typeof item === 'string') {
          return enforceQuality(item);
        } else if (typeof item === 'object' && item !== null) {
          return enforceQualityOnObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      (result as Record<string, unknown>)[key] = enforceQualityOnObject(
        value as Record<string, unknown>
      );
    }
  }

  return result;
}

// ============================================================================
// SPECIFIC FIELD ENFORCEMENT
// ============================================================================

/**
 * Enforces quality on recommendation statement.
 * Ensures single, decisive recommendation with no hedging.
 */
export function enforceRecommendationQuality(statement: string): string {
  let result = enforceQuality(statement);
  result = tightenRecommendation(result);
  result = enforceDeclarativeSentences(result);

  // Ensure starts with action verb for APPROVE/DEFER/REJECT contexts
  const actionVerbs = ['Proceed', 'Execute', 'Implement', 'Deploy', 'Defer', 'Reject', 'Do not'];
  const startsWithAction = actionVerbs.some(verb =>
    result.toLowerCase().startsWith(verb.toLowerCase())
  );

  if (!startsWithAction && result.length > 0) {
    // Prepend appropriate action based on content
    if (result.toLowerCase().includes('not') || result.toLowerCase().includes('reject')) {
      result = 'Do not proceed. ' + result;
    } else if (result.toLowerCase().includes('defer') || result.toLowerCase().includes('pending')) {
      result = 'Defer decision. ' + result;
    } else {
      result = 'Proceed. ' + result;
    }
  }

  return result;
}

/**
 * Enforces quality on rationale bullets.
 * Each bullet must have finding, evidence, and business outcome.
 */
export function enforceRationaleQuality(
  bullets: Array<{ finding: string; evidence_source: string; business_outcome: string }>
): Array<{ finding: string; evidence_source: string; business_outcome: string }> {
  return bullets.map(bullet => ({
    finding: enforceDeclarativeSentences(enforceQuality(bullet.finding)),
    evidence_source: enforceQuality(bullet.evidence_source),
    business_outcome: enforceDeclarativeSentences(enforceQuality(bullet.business_outcome)),
  }));
}

/**
 * Enforces quality on executive context fields.
 */
export function enforceContextQuality(context: {
  decision_domain: string;
  materiality: string;
  urgency_driver: string;
}): {
  decision_domain: string;
  materiality: string;
  urgency_driver: string;
} {
  return {
    decision_domain: enforceDeclarativeSentences(enforceQuality(context.decision_domain)),
    materiality: enforceDeclarativeSentences(enforceQuality(context.materiality)),
    urgency_driver: enforceDeclarativeSentences(enforceQuality(context.urgency_driver)),
  };
}

// ============================================================================
// FULL SYNTHESIS RESULT ENFORCEMENT
// ============================================================================

import { SynthesisResult } from './decision_input';

/**
 * Enforces executive language quality across entire synthesis result.
 * Returns board-ready output.
 */
export function enforceExecutiveQuality(result: SynthesisResult): SynthesisResult {
  return {
    executive_context: enforceContextQuality(result.executive_context),
    decision_framing: {
      decision_required: enforceDeclarativeSentences(
        enforceQuality(result.decision_framing.decision_required)
      ),
      alternatives_considered: result.decision_framing.alternatives_considered.map(alt => ({
        path: enforceQuality(alt.path),
        description: enforceDeclarativeSentences(enforceQuality(alt.description)),
      })),
      inaction_scenario: enforceDeclarativeSentences(
        enforceQuality(result.decision_framing.inaction_scenario)
      ),
    },
    recommendation: {
      disposition: result.recommendation.disposition, // Never change disposition
      statement: enforceRecommendationQuality(result.recommendation.statement),
      rationale_bullets: enforceRationaleQuality(result.recommendation.rationale_bullets),
    },
    risks_and_tradeoffs: {
      key_risks: result.risks_and_tradeoffs.key_risks.map(risk => ({
        ...risk,
        risk: enforceQuality(risk.risk),
        accepted_because: enforceDeclarativeSentences(enforceQuality(risk.accepted_because)),
      })),
      tradeoffs_accepted: result.risks_and_tradeoffs.tradeoffs_accepted.map(tradeoff => ({
        choosing: enforceQuality(tradeoff.choosing),
        forgoing: enforceQuality(tradeoff.forgoing),
        in_exchange_for: enforceQuality(tradeoff.in_exchange_for),
      })),
      unmitigated_risks: result.risks_and_tradeoffs.unmitigated_risks.map(risk => ({
        risk: enforceQuality(risk.risk),
        level: risk.level,
        reason_accepted: enforceDeclarativeSentences(enforceQuality(risk.reason_accepted)),
      })),
    },
    constraints: {
      budget: result.constraints.budget
        ? {
            ceiling: enforceQuality(result.constraints.budget.ceiling),
            envelope: enforceQuality(result.constraints.budget.envelope),
            contingency: enforceQuality(result.constraints.budget.contingency),
          }
        : undefined,
      policy: result.constraints.policy.map(p => enforceQuality(p)),
      organizational: result.constraints.organizational.map(o => enforceQuality(o)),
      regulatory: result.constraints.regulatory.map(r => enforceQuality(r)),
    },
    erp_resolutions: result.erp_resolutions.map(res => ({
      type: res.type,
      action: enforceDeclarativeSentences(enforceQuality(res.action)),
      target: enforceQuality(res.target),
      effective_date: res.effective_date,
    })),
    decision_displacement: {
      statement: enforceDeclarativeSentences(
        enforceQuality(result.decision_displacement.statement)
      ),
      enterprise_activity: enforceQuality(result.decision_displacement.enterprise_activity),
    },
    micro_macro_narrative: {
      operational_action: enforceDeclarativeSentences(
        enforceQuality(result.micro_macro_narrative.operational_action)
      ),
      aggregation_effect: enforceDeclarativeSentences(
        enforceQuality(result.micro_macro_narrative.aggregation_effect)
      ),
      enterprise_outcome: enforceDeclarativeSentences(
        enforceQuality(result.micro_macro_narrative.enterprise_outcome)
      ),
    },
    next_actions: {
      approve: result.next_actions.approve.map(action => ({
        action: enforceDeclarativeSentences(enforceQuality(action.action)),
        owner: enforceQuality(action.owner),
        timeline: enforceQuality(action.timeline),
      })),
      defer: result.next_actions.defer.map(action => ({
        action: enforceDeclarativeSentences(enforceQuality(action.action)),
        pending: enforceQuality(action.pending),
        revisit_date: enforceQuality(action.revisit_date),
      })),
      reject: result.next_actions.reject.map(action => ({
        alternative: enforceQuality(action.alternative),
        reason: enforceDeclarativeSentences(enforceQuality(action.reason)),
      })),
    },
    metadata: {
      ...result.metadata,
      assumptions: result.metadata.assumptions.map(a =>
        enforceDeclarativeSentences(enforceQuality(a))
      ),
    },
    raw_response: result.raw_response,
  };
}
