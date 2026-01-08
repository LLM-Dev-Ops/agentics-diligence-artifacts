/**
 * @agentics/contracts - JSON Schema contracts for Agentics APIs
 *
 * Provides strict JSON Schema validation contracts for API request/response validation.
 * All schemas enforce strict mode with no coercion and no defaults.
 */

const requestSchema = require('./diligence/v1/request.schema.json');
const responseSchema = require('./diligence/v1/response.schema.json');

module.exports = {
  diligence: {
    v1: {
      request: requestSchema,
      response: responseSchema
    }
  },
  schemas: {
    'diligence/v1/request': requestSchema,
    'diligence/v1/response': responseSchema
  }
};
