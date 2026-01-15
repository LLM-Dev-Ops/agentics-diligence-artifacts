/**
 * Renders SynthesisResult into deterministic Markdown format.
 * Writes to disk and returns content for stdout.
 */
import { SynthesisResult } from './decision_input';
/**
 * Renders synthesis result to deterministic Markdown structure.
 */
export declare function renderMarkdown(result: SynthesisResult): string;
/**
 * Writes Markdown to disk at specified path.
 * Returns the rendered content for stdout.
 */
export declare function writeDecisionSummary(result: SynthesisResult, outputPath?: string): string;
//# sourceMappingURL=render_markdown.d.ts.map