/**
 * Synthesizer module for LLM orchestration.
 * Accepts DecisionInput, calls LLM, returns structured sections.
 */
import { DecisionInput, SynthesisResult } from './decision_input';
interface LLMConfig {
    apiKey: string;
    baseUrl?: string;
    model?: string;
}
/**
 * Main synthesis function.
 * Accepts DecisionInput, calls LLM, returns SynthesisResult.
 */
export declare function synthesize(input: DecisionInput, config?: LLMConfig): Promise<SynthesisResult>;
export {};
//# sourceMappingURL=synthesizer.d.ts.map