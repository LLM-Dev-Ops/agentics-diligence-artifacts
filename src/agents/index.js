/**
 * Agentics Diligence Documentation Agents
 *
 * Exports the Documentation Generator Agent for the agentics-diligence-artifacts repository.
 *
 * Agent Classification: DOCUMENTATION GENERATION
 * decision_type: "documentation_generation"
 */

const {
  DocumentationGeneratorAgent,
  createDocumentationGeneratorAgent,
  ValidationError,
  AGENT_ID,
  AGENT_VERSION,
  DECISION_TYPE,
  SOURCE_SYSTEM
} = require('./documentation-generator-agent');

module.exports = {
  // Documentation Generator Agent
  DocumentationGeneratorAgent,
  createDocumentationGeneratorAgent,
  ValidationError,
  AGENT_ID,
  AGENT_VERSION,
  DECISION_TYPE,
  SOURCE_SYSTEM,

  // Agent registry
  registry: {
    [AGENT_ID]: {
      id: AGENT_ID,
      version: AGENT_VERSION,
      decisionType: DECISION_TYPE,
      sourceSystem: SOURCE_SYSTEM,
      classification: 'DOCUMENTATION GENERATION',
      create: createDocumentationGeneratorAgent,
      class: DocumentationGeneratorAgent
    }
  }
};
