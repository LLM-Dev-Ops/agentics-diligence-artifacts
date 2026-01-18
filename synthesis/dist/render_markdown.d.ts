/**
 * Renders SynthesisResult into deterministic Markdown format.
 * Produces canonical 10-section Executive Decision Packet.
 *
 * Suitable for board / CIO / CFO consumption.
 */
import { SynthesisResult, LegacySynthesisResult } from './decision_input';
/**
 * Renders canonical SynthesisResult to Executive Decision Packet Markdown.
 * Applies final quality enforcement pass to ensure board-ready output.
 */
export declare function renderMarkdown(result: SynthesisResult): string;
/**
 * Renders legacy SynthesisResult format for backward compatibility.
 */
export declare function renderLegacyMarkdown(result: LegacySynthesisResult): string;
/**
 * Writes Markdown to disk at specified path.
 * Returns the rendered content for stdout.
 * Supports both canonical and legacy formats.
 */
export declare function writeDecisionSummary(result: SynthesisResult | LegacySynthesisResult, outputPath?: string): string;
//# sourceMappingURL=render_markdown.d.ts.map