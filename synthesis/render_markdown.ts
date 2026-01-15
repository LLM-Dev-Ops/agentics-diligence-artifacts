/**
 * Renders SynthesisResult into deterministic Markdown format.
 * Writes to disk and returns content for stdout.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SynthesisResult } from './decision_input';

const DEFAULT_OUTPUT_PATH = 'decision-summary.md';

/**
 * Renders synthesis result to deterministic Markdown structure.
 */
export function renderMarkdown(result: SynthesisResult): string {
  const { sections } = result;
  const timestamp = new Date().toISOString().split('T')[0];

  return `# AI Deployment Decision Summary

*Generated: ${timestamp}*

---

## 1. Objective

${sections.objective}

---

## 2. What Was Evaluated

${sections.evaluated}

---

## 3. Key Findings

### Financial Impact

${sections.findings.financial_impact}

### Risk Exposure

${sections.findings.risk_exposure}

### System / Integration Complexity

${sections.findings.system_complexity}

---

## 4. Comparative Scenarios

${sections.comparative_scenarios}

---

## 5. Recommendation

${sections.recommendation}

---

## 6. Confidence & Key Assumptions

${sections.confidence_assumptions}

---

*This summary was generated from automated evaluation outputs. All findings are derived from the provided evidence.*
`;
}

/**
 * Writes Markdown to disk at specified path.
 * Returns the rendered content for stdout.
 */
export function writeDecisionSummary(
  result: SynthesisResult,
  outputPath?: string
): string {
  const markdown = renderMarkdown(result);
  const targetPath = outputPath || DEFAULT_OUTPUT_PATH;

  // Ensure directory exists
  const dir = path.dirname(targetPath);
  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, markdown, 'utf-8');

  return markdown;
}
