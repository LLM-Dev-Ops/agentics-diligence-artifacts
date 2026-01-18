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
export interface QualityViolation {
    type: 'casual' | 'hedging' | 'speculative' | 'jargon' | 'emoji' | 'passive' | 'vague';
    original: string;
    suggestion: string;
    reason: string;
    position: number;
}
export interface QualityReport {
    passed: boolean;
    score: number;
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
/**
 * Validates text against executive language quality standards.
 * Returns detailed report with violations and suggestions.
 */
export declare function validateQuality(text: string): QualityReport;
/**
 * Enforces quality by rewriting text to meet standards.
 * Returns cleaned text ready for board presentation.
 */
export declare function enforceQuality(text: string): string;
/**
 * Ensures sentences are declarative and answer "so what?"
 */
export declare function enforceDeclarativeSentences(text: string): string;
/**
 * Tightens recommendations to be direct and actionable.
 */
export declare function tightenRecommendation(text: string): string;
/**
 * Processes all text fields in an object, enforcing quality.
 */
export declare function enforceQualityOnObject<T extends Record<string, unknown>>(obj: T): T;
/**
 * Enforces quality on recommendation statement.
 * Ensures single, decisive recommendation with no hedging.
 */
export declare function enforceRecommendationQuality(statement: string): string;
/**
 * Enforces quality on rationale bullets.
 * Each bullet must have finding, evidence, and business outcome.
 */
export declare function enforceRationaleQuality(bullets: Array<{
    finding: string;
    evidence_source: string;
    business_outcome: string;
}>): Array<{
    finding: string;
    evidence_source: string;
    business_outcome: string;
}>;
/**
 * Enforces quality on executive context fields.
 */
export declare function enforceContextQuality(context: {
    decision_domain: string;
    materiality: string;
    urgency_driver: string;
}): {
    decision_domain: string;
    materiality: string;
    urgency_driver: string;
};
import { SynthesisResult } from './decision_input';
/**
 * Enforces executive language quality across entire synthesis result.
 * Returns board-ready output.
 */
export declare function enforceExecutiveQuality(result: SynthesisResult): SynthesisResult;
//# sourceMappingURL=language_quality.d.ts.map