#!/usr/bin/env npx ts-node
/**
 * Synthesis Layer Entry Point
 *
 * Converts Agentics CLI JSON outputs into board-ready executive decision memos.
 *
 * Usage:
 *   npx ts-node synthesis/index.ts --objective "..." --command "..." --input file.json
 *   agentics simulate | npx ts-node synthesis/index.ts --objective "..." --command "agentics simulate"
 *
 * Environment variables:
 *   OPENAI_API_KEY or ANTHROPIC_API_KEY - Required for LLM calls
 *   LLM_BASE_URL - Optional custom endpoint
 *   LLM_MODEL - Optional model override
 */
export { DecisionInput, SynthesisResult, LegacySynthesisResult, ExtractedEvidence, PolicyViolation, CostVariance, FailureRate, LatencyImpact, BindingConstraint, MicroDistribution, RecommendationDisposition, ExecutiveContext, DecisionFraming, Recommendation, RisksAndTradeoffs, Constraints, ERPResolution, DecisionDisplacement, MicroMacroNarrative, NextActions, validateDecisionInput, } from './decision_input';
export { synthesize, synthesizeLegacy } from './synthesizer';
export { renderMarkdown, renderLegacyMarkdown, writeDecisionSummary } from './render_markdown';
export { extractEvidence, extractDecisionFraming, determineRecommendation, buildRecommendationStatement, extractRisksAndTradeoffs, detectConstraints, generateDecisionDisplacement, buildMicroMacroNarrative, } from './extraction';
export { validateQuality, enforceQuality, enforceDeclarativeSentences, tightenRecommendation, enforceQualityOnObject, enforceRecommendationQuality, enforceRationaleQuality, enforceContextQuality, enforceExecutiveQuality, QualityViolation, QualityReport, } from './language_quality';
//# sourceMappingURL=index.d.ts.map