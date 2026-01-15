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
export { DecisionInput, SynthesisResult, validateDecisionInput } from './decision_input';
export { synthesize } from './synthesizer';
export { renderMarkdown, writeDecisionSummary } from './render_markdown';
//# sourceMappingURL=index.d.ts.map