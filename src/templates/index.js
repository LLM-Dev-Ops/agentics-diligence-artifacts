/**
 * Documentation Templates for Documentation Generator Agent
 *
 * Templates for generating various documentation artifacts.
 * Each template produces deterministic, human-readable output.
 */

/**
 * Template configurations by artifact type
 */
const TEMPLATES = {
  diligence_report: {
    id: 'diligence-report-v1',
    name: 'Due Diligence Report',
    sections: [
      { id: 'executive_summary', title: 'Executive Summary', required: true },
      { id: 'company_overview', title: 'Company Overview', required: true },
      { id: 'financial_analysis', title: 'Financial Analysis', required: true },
      { id: 'operational_assessment', title: 'Operational Assessment', required: true },
      { id: 'technology_review', title: 'Technology Review', required: true },
      { id: 'risk_assessment', title: 'Risk Assessment', required: true },
      { id: 'regulatory_compliance', title: 'Regulatory & Compliance', required: true },
      { id: 'key_findings', title: 'Key Findings', required: true },
      { id: 'recommendations', title: 'Recommendations', required: true },
      { id: 'appendices', title: 'Appendices', required: false }
    ]
  },
  executive_summary: {
    id: 'executive-summary-v1',
    name: 'Executive Summary',
    sections: [
      { id: 'overview', title: 'Overview', required: true },
      { id: 'key_metrics', title: 'Key Metrics', required: true },
      { id: 'highlights', title: 'Highlights', required: true },
      { id: 'risks_concerns', title: 'Risks & Concerns', required: true },
      { id: 'recommendation', title: 'Recommendation', required: true }
    ]
  },
  technical_assessment: {
    id: 'technical-assessment-v1',
    name: 'Technical Assessment',
    sections: [
      { id: 'architecture_overview', title: 'Architecture Overview', required: true },
      { id: 'technology_stack', title: 'Technology Stack', required: true },
      { id: 'scalability', title: 'Scalability Analysis', required: true },
      { id: 'security_posture', title: 'Security Posture', required: true },
      { id: 'technical_debt', title: 'Technical Debt', required: true },
      { id: 'integration_points', title: 'Integration Points', required: true },
      { id: 'recommendations', title: 'Technical Recommendations', required: true }
    ]
  },
  risk_report: {
    id: 'risk-report-v1',
    name: 'Risk Report',
    sections: [
      { id: 'risk_summary', title: 'Risk Summary', required: true },
      { id: 'financial_risks', title: 'Financial Risks', required: true },
      { id: 'operational_risks', title: 'Operational Risks', required: true },
      { id: 'technology_risks', title: 'Technology Risks', required: true },
      { id: 'regulatory_risks', title: 'Regulatory Risks', required: true },
      { id: 'market_risks', title: 'Market Risks', required: true },
      { id: 'mitigation_strategies', title: 'Mitigation Strategies', required: true }
    ]
  },
  compliance_report: {
    id: 'compliance-report-v1',
    name: 'Compliance Report',
    sections: [
      { id: 'compliance_summary', title: 'Compliance Summary', required: true },
      { id: 'regulatory_framework', title: 'Regulatory Framework', required: true },
      { id: 'current_status', title: 'Current Compliance Status', required: true },
      { id: 'gaps_findings', title: 'Gaps & Findings', required: true },
      { id: 'remediation_plan', title: 'Remediation Plan', required: true },
      { id: 'attestations', title: 'Attestations', required: false }
    ]
  },
  audit_package: {
    id: 'audit-package-v1',
    name: 'Audit Package',
    sections: [
      { id: 'audit_scope', title: 'Audit Scope', required: true },
      { id: 'methodology', title: 'Methodology', required: true },
      { id: 'findings', title: 'Findings', required: true },
      { id: 'observations', title: 'Observations', required: true },
      { id: 'management_response', title: 'Management Response', required: false },
      { id: 'action_items', title: 'Action Items', required: true }
    ]
  },
  governance_memo: {
    id: 'governance-memo-v1',
    name: 'Governance Memo',
    sections: [
      { id: 'purpose', title: 'Purpose', required: true },
      { id: 'background', title: 'Background', required: true },
      { id: 'analysis', title: 'Analysis', required: true },
      { id: 'options', title: 'Options Considered', required: true },
      { id: 'recommendation', title: 'Recommendation', required: true },
      { id: 'next_steps', title: 'Next Steps', required: true }
    ]
  },
  investment_memo: {
    id: 'investment-memo-v1',
    name: 'Investment Memo',
    sections: [
      { id: 'thesis', title: 'Investment Thesis', required: true },
      { id: 'company_overview', title: 'Company Overview', required: true },
      { id: 'market_opportunity', title: 'Market Opportunity', required: true },
      { id: 'financial_overview', title: 'Financial Overview', required: true },
      { id: 'competitive_landscape', title: 'Competitive Landscape', required: true },
      { id: 'risks', title: 'Key Risks', required: true },
      { id: 'valuation', title: 'Valuation', required: true },
      { id: 'recommendation', title: 'Recommendation', required: true }
    ]
  },
  architecture_overview: {
    id: 'architecture-overview-v1',
    name: 'Architecture Overview',
    sections: [
      { id: 'system_context', title: 'System Context', required: true },
      { id: 'components', title: 'Components', required: true },
      { id: 'data_flow', title: 'Data Flow', required: true },
      { id: 'integrations', title: 'Integrations', required: true },
      { id: 'deployment', title: 'Deployment Architecture', required: true },
      { id: 'security', title: 'Security Architecture', required: true }
    ]
  },
  decision_log: {
    id: 'decision-log-v1',
    name: 'Decision Log',
    sections: [
      { id: 'summary', title: 'Summary', required: true },
      { id: 'decisions', title: 'Decisions', required: true },
      { id: 'rationale', title: 'Rationale', required: true },
      { id: 'timeline', title: 'Timeline', required: true }
    ]
  }
};

/**
 * Get template configuration for an artifact type
 */
function getTemplate(artifactType) {
  return TEMPLATES[artifactType] || null;
}

/**
 * Get all available templates
 */
function getAllTemplates() {
  return Object.entries(TEMPLATES).map(([type, template]) => ({
    type,
    ...template
  }));
}

/**
 * Render document header
 */
function renderHeader(metadata, classification) {
  const classificationBanner = classification !== 'public'
    ? `**CLASSIFICATION: ${classification.toUpperCase()}**\n\n---\n\n`
    : '';

  return `${classificationBanner}# ${metadata.title || 'Documentation'}

${metadata.subtitle ? `## ${metadata.subtitle}\n\n` : ''}**Prepared for:** ${metadata.prepared_for || 'Internal Use'}
**Version:** ${metadata.version || '1.0'}
**Date:** ${new Date().toISOString().split('T')[0]}
**Generated by:** Agentics Documentation Generator

${metadata.confidentiality_notice ? `\n> ${metadata.confidentiality_notice}\n` : ''}
---

`;
}

/**
 * Render table of contents
 */
function renderTableOfContents(sections) {
  let toc = '## Table of Contents\n\n';
  sections.forEach((section, index) => {
    const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc += `${index + 1}. [${section.title}](#${anchor})\n`;
  });
  return toc + '\n---\n\n';
}

/**
 * Render a single section
 */
function renderSection(section, level = 2) {
  const heading = '#'.repeat(level);
  return `${heading} ${section.title}

${section.content || '_Section content not available._'}

`;
}

/**
 * Render document footer
 */
function renderFooter(metadata) {
  return `---

**Document ID:** ${metadata.artifact_id || 'N/A'}
**Generated:** ${metadata.generated_at || new Date().toISOString()}
**Source Events:** ${metadata.source_events_count || 0}

*This document was automatically generated by the Agentics Documentation Generator Agent.*
`;
}

/**
 * Build a complete document from sections
 */
function buildDocument(config) {
  const {
    metadata,
    classification,
    sections,
    includeTableOfContents = true
  } = config;

  let doc = renderHeader(metadata, classification);

  if (includeTableOfContents && sections.length > 0) {
    doc += renderTableOfContents(sections);
  }

  sections.forEach(section => {
    doc += renderSection(section);
  });

  doc += renderFooter({
    ...metadata,
    source_events_count: config.source_events_count
  });

  return doc;
}

/**
 * Calculate word count
 */
function calculateWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

module.exports = {
  TEMPLATES,
  getTemplate,
  getAllTemplates,
  renderHeader,
  renderTableOfContents,
  renderSection,
  renderFooter,
  buildDocument,
  calculateWordCount
};
