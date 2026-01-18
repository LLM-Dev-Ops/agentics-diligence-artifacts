"use strict";
/**
 * Renders SynthesisResult into deterministic Markdown format.
 * Produces canonical 10-section Executive Decision Packet.
 *
 * Suitable for board / CIO / CFO consumption.
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
exports.renderLegacyMarkdown = renderLegacyMarkdown;
exports.writeDecisionSummary = writeDecisionSummary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const language_quality_1 = require("./language_quality");
const DEFAULT_OUTPUT_PATH = 'decision-summary.md';
/**
 * Renders canonical SynthesisResult to Executive Decision Packet Markdown.
 * Applies final quality enforcement pass to ensure board-ready output.
 */
function renderMarkdown(result) {
    // Final quality gate - ensures board-ready output
    const qualityResult = (0, language_quality_1.enforceExecutiveQuality)(result);
    const timestamp = qualityResult.metadata.generated_at.split('T')[0];
    const disposition = qualityResult.recommendation.disposition;
    // Disposition badge
    const dispositionBadge = disposition === 'APPROVE'
        ? '**APPROVE**'
        : disposition === 'DEFER'
            ? '**DEFER**'
            : '**REJECT**';
    return `# Executive Decision Packet

*Generated: ${timestamp}* | *Confidence: ${qualityResult.metadata.confidence_level}* | *Data Completeness: ${qualityResult.metadata.data_completeness}*

---

## 1. Executive Context

| Element | Detail |
|---------|--------|
| **Decision Domain** | ${qualityResult.executive_context.decision_domain} |
| **Materiality** | ${qualityResult.executive_context.materiality} |
| **Urgency Driver** | ${qualityResult.executive_context.urgency_driver} |

---

## 2. Decision Framing

**Decision Required:** ${qualityResult.decision_framing.decision_required}

**Alternatives Considered:**

${qualityResult.decision_framing.alternatives_considered.map(a => `- **${a.path}** — ${a.description}`).join('\n')}

**If No Decision:** ${qualityResult.decision_framing.inaction_scenario}

---

## 3. Recommendation

${dispositionBadge}

> ${qualityResult.recommendation.statement}

---

## 4. Rationale

${qualityResult.recommendation.rationale_bullets.map(b => `- **${b.finding}** — ${b.evidence_source} demonstrates ${b.business_outcome}`).join('\n\n')}

---

## 5. Risks & Tradeoffs

### Key Risks

${qualityResult.risks_and_tradeoffs.key_risks.length > 0
        ? qualityResult.risks_and_tradeoffs.key_risks.map(r => `| ${r.risk} | ${r.likelihood} | ${r.impact} | ${r.accepted_because} |`).join('\n')
            ? `| Risk | Likelihood | Impact | Accepted Because |
|------|------------|--------|------------------|
${qualityResult.risks_and_tradeoffs.key_risks.map(r => `| ${r.risk} | ${r.likelihood} | ${r.impact} | ${r.accepted_because} |`).join('\n')}`
            : 'No key risks identified in simulation data.'
        : 'No key risks identified in simulation data.'}

### Tradeoffs Accepted

${qualityResult.risks_and_tradeoffs.tradeoffs_accepted.length > 0
        ? qualityResult.risks_and_tradeoffs.tradeoffs_accepted.map(t => `- Choosing **${t.choosing}** means forgoing *${t.forgoing}* in exchange for *${t.in_exchange_for}*`).join('\n')
        : 'No explicit tradeoffs documented.'}

### Unmitigated Risks

${qualityResult.risks_and_tradeoffs.unmitigated_risks.length > 0
        ? qualityResult.risks_and_tradeoffs.unmitigated_risks.map(u => `- **${u.risk}** remains at ${u.level} — ${u.reason_accepted}`).join('\n')
        : 'No unmitigated risks identified.'}

---

## 6. Constraints

${qualityResult.constraints.budget
        ? `### Budget
- **Ceiling:** ${qualityResult.constraints.budget.ceiling}
- **Envelope:** ${qualityResult.constraints.budget.envelope}
- **Contingency:** ${qualityResult.constraints.budget.contingency}
`
        : '### Budget\nNo budget constraints defined in simulation.\n'}

### Policy
${qualityResult.constraints.policy.length > 0 ? qualityResult.constraints.policy.map(p => `- ${p}`).join('\n') : 'No policy constraints defined.'}

### Organizational
${qualityResult.constraints.organizational.length > 0 ? qualityResult.constraints.organizational.map(o => `- ${o}`).join('\n') : 'No organizational constraints defined.'}

### Regulatory
${qualityResult.constraints.regulatory.length > 0 ? qualityResult.constraints.regulatory.map(r => `- ${r}`).join('\n') : 'No regulatory constraints defined.'}

---

## 7. ERP-Level Proposed Resolutions

${qualityResult.erp_resolutions.map((r, i) => `${i + 1}. **[${r.type.toUpperCase()}]** ${r.action} → *${r.target}*${r.effective_date ? ` (effective: ${r.effective_date})` : ''}`).join('\n')}

---

## 8. Decision Displacement

> ${qualityResult.decision_displacement.statement}

**Enterprise Activity Automated:** ${qualityResult.decision_displacement.enterprise_activity}

---

## 9. Micro → Macro Explanation

| Level | Description |
|-------|-------------|
| **Operational Action** | ${qualityResult.micro_macro_narrative.operational_action} |
| **Aggregation Effect** | ${qualityResult.micro_macro_narrative.aggregation_effect} |
| **Enterprise Outcome** | ${qualityResult.micro_macro_narrative.enterprise_outcome} |

---

## 10. Next Actions

${qualityResult.next_actions.approve.length > 0 ? `### Approve

| Action | Owner | Timeline |
|--------|-------|----------|
${qualityResult.next_actions.approve.map(a => `| ${a.action} | ${a.owner} | ${a.timeline} |`).join('\n')}
` : ''}
${qualityResult.next_actions.defer.length > 0 ? `### Defer

| Action | Pending | Revisit Date |
|--------|---------|--------------|
${qualityResult.next_actions.defer.map(d => `| ${d.action} | ${d.pending} | ${d.revisit_date} |`).join('\n')}
` : ''}
${qualityResult.next_actions.reject.length > 0 ? `### Reject

| Alternative | Reason |
|-------------|--------|
${qualityResult.next_actions.reject.map(r => `| ${r.alternative} | ${r.reason} |`).join('\n')}
` : ''}
---

## Metadata

- **Generated:** ${qualityResult.metadata.generated_at}
- **Data Completeness:** ${qualityResult.metadata.data_completeness}
- **Confidence Level:** ${qualityResult.metadata.confidence_level}

### Assumptions

${qualityResult.metadata.assumptions.length > 0
        ? qualityResult.metadata.assumptions.map(a => `- ${a}`).join('\n')
        : '- No assumptions documented'}

---

*This decision packet was generated from automated simulation outputs. All findings are derived from provided evidence. No data was fabricated or extrapolated beyond source material.*
`;
}
/**
 * Renders legacy SynthesisResult format for backward compatibility.
 */
function renderLegacyMarkdown(result) {
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
 * Type guard to check if result is canonical format.
 */
function isCanonicalResult(result) {
    return 'executive_context' in result && 'decision_framing' in result;
}
/**
 * Writes Markdown to disk at specified path.
 * Returns the rendered content for stdout.
 * Supports both canonical and legacy formats.
 */
function writeDecisionSummary(result, outputPath) {
    const markdown = isCanonicalResult(result)
        ? renderMarkdown(result)
        : renderLegacyMarkdown(result);
    const targetPath = outputPath || DEFAULT_OUTPUT_PATH;
    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (dir && dir !== '.') {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, markdown, 'utf-8');
    return markdown;
}
