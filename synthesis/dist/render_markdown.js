"use strict";
/**
 * Renders SynthesisResult into deterministic Markdown format.
 * Writes to disk and returns content for stdout.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMarkdown = renderMarkdown;
exports.writeDecisionSummary = writeDecisionSummary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_OUTPUT_PATH = 'decision-summary.md';
/**
 * Renders synthesis result to deterministic Markdown structure.
 */
function renderMarkdown(result) {
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
function writeDecisionSummary(result, outputPath) {
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
