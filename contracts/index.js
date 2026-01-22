/**
 * @agentics/contracts - JSON Schema contracts for Agentics APIs
 *
 * Provides strict JSON Schema validation contracts for API request/response validation.
 * All schemas enforce strict mode with no coercion and no defaults.
 */

const requestSchema = require('./diligence/v1/request.schema.json');
const responseSchema = require('./diligence/v1/response.schema.json');
const documentationDecisionEventSchema = require('./documentation/v1/decision-event.schema.json');
const documentationGeneratorSchema = require('./documentation/v1/generator.schema.json');

module.exports = {
  diligence: {
    v1: {
      request: requestSchema,
      response: responseSchema
    }
  },
  documentation: {
    v1: {
      decisionEvent: documentationDecisionEventSchema,
      generator: documentationGeneratorSchema
    }
  },
  schemas: {
    'diligence/v1/request': requestSchema,
    'diligence/v1/response': responseSchema,
    'documentation/v1/decision-event': documentationDecisionEventSchema,
    'documentation/v1/generator': documentationGeneratorSchema
  },
  /**
   * Agent identifiers for registration
   */
  agents: {
    DOCUMENTATION_GENERATOR_AGENT: 'documentation-generator-agent'
  },
  /**
   * Decision types for classification
   */
  decisionTypes: {
    DOCUMENTATION_GENERATION: 'documentation_generation'
  }
};
