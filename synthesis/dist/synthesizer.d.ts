/**
 * Synthesizer module for LLM orchestration.
 * Produces canonical Executive Decision Packet with deterministic extraction.
 *
 * Constraints:
 * - Do NOT hallucinate data
 * - Do NOT infer beyond simulation outputs
 * - Prefer explicit "unknown" over assumption
 */
import { DecisionInput, SynthesisResult, LegacySynthesisResult } from './decision_input';
interface LLMConfig {
    apiKey: string;
    baseUrl?: string;
    model?: string;
}
/**
 * Main synthesis function - produces canonical Executive Decision Packet.
 * Uses deterministic extraction with LLM enhancement for context sections.
 */
export declare function synthesize(input: DecisionInput, config?: LLMConfig): Promise<SynthesisResult>;
/**
 * Legacy synthesis function for backward compatibility.
 */
export declare function synthesizeLegacy(input: DecisionInput, config?: LLMConfig): Promise<LegacySynthesisResult>;
export {};
//# sourceMappingURL=synthesizer.d.ts.map