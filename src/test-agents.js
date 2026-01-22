#!/usr/bin/env node
/**
 * Documentation Generator Agent Verification Tests
 *
 * Validates:
 * 1. Contract schema compliance
 * 2. Agent boundary constraints
 * 3. DecisionEvent emission requirements
 * 4. Template generation correctness
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const contracts = require('@agentics/contracts');
const {
  createDocumentationGeneratorAgent,
  AGENT_ID,
  AGENT_VERSION,
  DECISION_TYPE,
  SOURCE_SYSTEM
} = require('./agents');
const templates = require('./templates');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const passed = actual === expected;
  if (passed) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(`    Expected: ${expected}`);
    console.log(`    Actual: ${actual}`);
  }
}

function assertSchema(ajv, schema, data, message) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (valid) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(`    Validation errors: ${JSON.stringify(validate.errors, null, 2)}`);
  }
  return valid;
}

// Initialize AJV with draft-07 support
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

/**
 * Test Suite: Contract Schemas
 */
function testContractSchemas() {
  console.log('\n=== Contract Schema Tests ===\n');

  // Test 1: Decision Event Schema exists and is valid JSON Schema
  console.log('Testing DecisionEvent schema:');
  assert(
    contracts.documentation?.v1?.decisionEvent,
    'DecisionEvent schema exists in contracts'
  );

  const decisionEventSchema = contracts.documentation.v1.decisionEvent;
  assertEqual(
    decisionEventSchema.$schema,
    'http://json-schema.org/draft-07/schema#',
    'DecisionEvent uses JSON Schema draft-07'
  );
  assertEqual(
    decisionEventSchema.properties?.agent_id?.const,
    'documentation-generator-agent',
    'DecisionEvent schema has correct agent_id const'
  );
  assertEqual(
    decisionEventSchema.properties?.decision_type?.const,
    'documentation_generation',
    'DecisionEvent schema has correct decision_type const'
  );

  // Test 2: Generator Schema exists and is valid
  console.log('\nTesting Generator schema:');
  assert(
    contracts.documentation?.v1?.generator,
    'Generator schema exists in contracts'
  );

  const generatorSchema = contracts.documentation.v1.generator;
  assert(
    generatorSchema.definitions?.DocumentationGeneratorInput,
    'Generator schema defines DocumentationGeneratorInput'
  );
  assert(
    generatorSchema.definitions?.DocumentationGeneratorOutput,
    'Generator schema defines DocumentationGeneratorOutput'
  );

  // Test 3: Artifact types match template types
  console.log('\nTesting artifact type alignment:');
  const schemaArtifactTypes = generatorSchema.definitions.DocumentationGeneratorInput.properties.artifact_type.enum;
  const templateTypes = templates.getAllTemplates().map(t => t.type);

  for (const type of schemaArtifactTypes) {
    assert(
      templateTypes.includes(type),
      `Template exists for artifact type: ${type}`
    );
  }
}

/**
 * Test Suite: Agent Constants
 */
function testAgentConstants() {
  console.log('\n=== Agent Constants Tests ===\n');

  assertEqual(
    AGENT_ID,
    'documentation-generator-agent',
    'AGENT_ID matches contract specification'
  );

  assertEqual(
    DECISION_TYPE,
    'documentation_generation',
    'DECISION_TYPE matches contract specification'
  );

  assertEqual(
    SOURCE_SYSTEM,
    'agentics-diligence-artifacts',
    'SOURCE_SYSTEM matches repository name'
  );

  assert(
    AGENT_VERSION.match(/^\d+\.\d+\.\d+$/),
    'AGENT_VERSION follows semver format'
  );
}

/**
 * Test Suite: Template System
 */
function testTemplateSystem() {
  console.log('\n=== Template System Tests ===\n');

  const allTemplates = templates.getAllTemplates();
  assert(
    allTemplates.length >= 10,
    `All 10 artifact types have templates (found ${allTemplates.length})`
  );

  // Test each template has required structure
  for (const template of allTemplates) {
    assert(
      template.id && template.type && template.name && template.sections,
      `Template ${template.type} has required fields`
    );
    assert(
      template.sections.length > 0,
      `Template ${template.type} has at least one section`
    );
  }

  // Test template retrieval
  const diligenceTemplate = templates.getTemplate('diligence_report');
  assert(
    diligenceTemplate !== null,
    'Can retrieve diligence_report template'
  );

  // Test document building
  const testConfig = {
    metadata: {
      title: 'Test Project Document',
      prepared_for: 'Test User',
      version: '1.0',
      artifact_id: '550e8400-e29b-41d4-a716-446655440000',
      generated_at: new Date().toISOString()
    },
    classification: 'internal',
    sections: [
      { section_id: 'intro', title: 'Introduction', content: 'Test content here', completeness: 1.0 }
    ],
    includeTableOfContents: true,
    source_events_count: 5
  };

  const doc = templates.buildDocument(testConfig);
  assert(
    doc.includes('Test Project Document'),
    'Built document includes title'
  );
  assert(
    doc.includes('Test content here'),
    'Built document includes section content'
  );
}

/**
 * Test Suite: Agent Input Validation
 */
function testAgentInputValidation() {
  console.log('\n=== Agent Input Validation Tests ===\n');

  const generatorSchema = contracts.documentation.v1.generator;

  // Create a standalone input schema for testing (without $ref dependencies)
  const inputSchema = {
    type: 'object',
    properties: {
      request_id: { type: 'string', format: 'uuid' },
      artifact_type: {
        type: 'string',
        enum: ['diligence_report', 'executive_summary', 'technical_assessment', 'risk_report', 'compliance_report', 'audit_package', 'governance_memo', 'investment_memo', 'architecture_overview', 'decision_log']
      },
      format: { type: 'string', enum: ['markdown', 'json', 'html', 'pdf_metadata'] },
      scope: { type: 'string', enum: ['full', 'summary', 'section', 'incremental'] },
      audience: { type: 'string', enum: ['executive', 'technical', 'compliance', 'investor', 'auditor', 'board'] },
      classification: { type: 'string', enum: ['public', 'internal', 'confidential', 'restricted'] }
    },
    required: ['request_id', 'artifact_type', 'audience']
  };

  // Valid input
  const validInput = {
    request_id: '550e8400-e29b-41d4-a716-446655440000',
    artifact_type: 'executive_summary',
    format: 'markdown',
    scope: 'full',
    audience: 'executive',
    classification: 'internal'
  };

  assertSchema(ajv, inputSchema, validInput, 'Valid input passes schema validation');

  // Invalid input - missing required field
  const invalidInput = {
    request_id: '550e8400-e29b-41d4-a716-446655440000',
    format: 'markdown'
    // missing artifact_type and audience
  };

  const validateInvalid = ajv.compile(inputSchema);
  assert(
    !validateInvalid(invalidInput),
    'Invalid input (missing artifact_type) fails validation'
  );

  // Invalid input - wrong artifact type
  const wrongTypeInput = {
    ...validInput,
    artifact_type: 'invalid_type'
  };

  const validateWrongType = ajv.compile(inputSchema);
  assert(
    !validateWrongType(wrongTypeInput),
    'Invalid artifact_type fails validation'
  );

  // Verify schema structure matches contract
  assert(
    generatorSchema.definitions.DocumentationGeneratorInput.properties.artifact_type.enum.length === 10,
    'Contract defines all 10 artifact types'
  );
}

/**
 * Test Suite: Agent Output Validation
 */
function testAgentOutputValidation() {
  console.log('\n=== Agent Output Validation Tests ===\n');

  const generatorSchema = contracts.documentation.v1.generator;

  // Create standalone output schema for essential fields
  const outputSchema = {
    type: 'object',
    properties: {
      artifact: {
        type: 'object',
        properties: {
          artifact_id: { type: 'string', format: 'uuid' },
          artifact_type: { type: 'string' },
          format: { type: 'string', enum: ['markdown', 'json', 'html', 'pdf_metadata'] },
          title: { type: 'string' },
          content: { type: 'string' },
          sections: { type: 'array', items: { type: 'object' } }
        },
        required: ['artifact_id', 'artifact_type', 'format', 'title', 'content', 'sections']
      },
      generation_stats: {
        type: 'object',
        properties: {
          sections_generated: { type: 'integer', minimum: 0 },
          total_word_count: { type: 'integer', minimum: 0 },
          source_events_processed: { type: 'integer', minimum: 0 },
          generation_duration_ms: { type: 'integer', minimum: 0 }
        },
        required: ['sections_generated', 'total_word_count', 'source_events_processed', 'generation_duration_ms']
      },
      quality_metrics: {
        type: 'object',
        properties: {
          overall_completeness: { type: 'number', minimum: 0, maximum: 1 },
          data_coverage: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['overall_completeness', 'data_coverage']
      },
      storage: {
        type: 'object',
        properties: {
          stored: { type: 'boolean' }
        },
        required: ['stored']
      }
    },
    required: ['artifact', 'generation_stats', 'quality_metrics', 'storage']
  };

  // Valid output
  const validOutput = {
    artifact: {
      artifact_id: '550e8400-e29b-41d4-a716-446655440001',
      artifact_type: 'executive_summary',
      format: 'markdown',
      title: 'Executive Summary',
      content: '# Executive Summary\n\nTest content.',
      sections: [{ section_id: 'exec_overview', title: 'Overview', content: 'Test', completeness: 1.0 }]
    },
    generation_stats: {
      sections_generated: 1,
      total_word_count: 100,
      source_events_processed: 10,
      generation_duration_ms: 500
    },
    quality_metrics: {
      overall_completeness: 0.95,
      data_coverage: 0.9
    },
    storage: {
      stored: true,
      storage_ref: 'doc:550e8400-e29b-41d4-a716-446655440001'
    }
  };

  assertSchema(ajv, outputSchema, validOutput, 'Valid output passes schema validation');

  // Verify contract schema defines required structures
  assert(
    generatorSchema.definitions.DocumentationGeneratorOutput.properties.artifact,
    'Contract output schema defines artifact property'
  );
  assert(
    generatorSchema.definitions.DocumentationGeneratorOutput.properties.generation_stats,
    'Contract output schema defines generation_stats property'
  );
  assert(
    generatorSchema.definitions.DocumentationGeneratorOutput.properties.quality_metrics,
    'Contract output schema defines quality_metrics property'
  );
}

/**
 * Test Suite: DecisionEvent Validation
 */
function testDecisionEventValidation() {
  console.log('\n=== DecisionEvent Validation Tests ===\n');

  const decisionEventSchema = contracts.documentation.v1.decisionEvent;

  // Valid DecisionEvent (matching schema exactly)
  const validEvent = {
    agent_id: 'documentation-generator-agent',
    agent_version: '1.0.0',
    decision_type: 'documentation_generation',
    inputs_hash: 'a'.repeat(64), // 64 hex chars as per schema pattern
    outputs: {
      artifact_id: '550e8400-e29b-41d4-a716-446655440001',
      artifact_type: 'executive_summary',
      format: 'markdown',
      sections_generated: ['executive_overview', 'key_findings'],
      source_events_count: 10,
      word_count: 500,
      storage_ref: 'doc:550e8400-e29b-41d4-a716-446655440001'
    },
    confidence: 0.95,
    constraints_applied: {
      scope: 'full',
      timeframe: {
        from: '2024-01-01T00:00:00Z',
        to: '2024-12-31T23:59:59Z'
      },
      artifact_type: 'executive_summary',
      audience: 'executive',
      classification: 'internal'
    },
    execution_ref: '550e8400-e29b-41d4-a716-446655440002',
    timestamp: new Date().toISOString(),
    source_system: 'agentics-diligence-artifacts'
  };

  assertSchema(ajv, decisionEventSchema, validEvent, 'Valid DecisionEvent passes schema validation');

  // Test required fields
  const requiredFields = ['agent_id', 'agent_version', 'decision_type', 'inputs_hash', 'outputs', 'confidence', 'constraints_applied', 'execution_ref', 'timestamp', 'source_system'];

  for (const field of requiredFields) {
    const missingFieldEvent = { ...validEvent };
    delete missingFieldEvent[field];
    const validate = ajv.compile(decisionEventSchema);
    assert(
      !validate(missingFieldEvent),
      `DecisionEvent validation fails when missing ${field}`
    );
  }

  // Test agent_id const
  const wrongAgentEvent = {
    ...validEvent,
    agent_id: 'wrong-agent-id'
  };
  const validateWrongAgent = ajv.compile(decisionEventSchema);
  assert(
    !validateWrongAgent(wrongAgentEvent),
    'DecisionEvent validation fails with wrong agent_id'
  );
}

/**
 * Test Suite: Agent Boundary Compliance
 */
function testBoundaryCompliance() {
  console.log('\n=== Boundary Compliance Tests ===\n');

  const agent = createDocumentationGeneratorAgent();

  // Test: Agent has generate method
  assert(
    typeof agent.generate === 'function',
    'Agent has generate() method'
  );

  // Test: Agent does NOT have learning methods
  assert(
    typeof agent.learn === 'undefined',
    'Agent does NOT have learn() method (boundary compliance)'
  );
  assert(
    typeof agent.assimilate === 'undefined',
    'Agent does NOT have assimilate() method (boundary compliance)'
  );
  assert(
    typeof agent.train === 'undefined',
    'Agent does NOT have train() method (boundary compliance)'
  );

  // Test: Agent does NOT have orchestration methods
  assert(
    typeof agent.orchestrate === 'undefined',
    'Agent does NOT have orchestrate() method (boundary compliance)'
  );
  assert(
    typeof agent.trigger === 'undefined',
    'Agent does NOT have trigger() method (boundary compliance)'
  );

  // Test: Agent does NOT have inference methods
  assert(
    typeof agent.infer === 'undefined',
    'Agent does NOT have infer() method (boundary compliance)'
  );
  assert(
    typeof agent.predict === 'undefined',
    'Agent does NOT have predict() method (boundary compliance)'
  );
}

/**
 * Test Suite: Contracts Index
 */
function testContractsIndex() {
  console.log('\n=== Contracts Index Tests ===\n');

  // Test schemas lookup
  assert(
    contracts.schemas['documentation/v1/decision-event'],
    'DecisionEvent schema accessible via schemas lookup'
  );
  assert(
    contracts.schemas['documentation/v1/generator'],
    'Generator schema accessible via schemas lookup'
  );

  // Test agents registry
  assertEqual(
    contracts.agents.DOCUMENTATION_GENERATOR_AGENT,
    'documentation-generator-agent',
    'DOCUMENTATION_GENERATOR_AGENT constant exported'
  );

  // Test decision types
  assertEqual(
    contracts.decisionTypes.DOCUMENTATION_GENERATION,
    'documentation_generation',
    'DOCUMENTATION_GENERATION decision type exported'
  );
}

/**
 * Test Suite: Agent Registry
 */
function testAgentRegistry() {
  console.log('\n=== Agent Registry Tests ===\n');

  const { registry } = require('./agents');

  assert(
    registry['documentation-generator-agent'],
    'Agent registered in registry'
  );

  const registeredAgent = registry['documentation-generator-agent'];
  assertEqual(
    registeredAgent.id,
    'documentation-generator-agent',
    'Registry entry has correct id'
  );
  assertEqual(
    registeredAgent.decisionType,
    'documentation_generation',
    'Registry entry has correct decisionType'
  );
  assertEqual(
    registeredAgent.classification,
    'DOCUMENTATION GENERATION',
    'Registry entry has correct classification'
  );
  assert(
    typeof registeredAgent.create === 'function',
    'Registry entry has create function'
  );
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Documentation Generator Agent Verification Tests        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    testContractSchemas();
    testAgentConstants();
    testTemplateSystem();
    testAgentInputValidation();
    testAgentOutputValidation();
    testDecisionEventValidation();
    testBoundaryCompliance();
    testContractsIndex();
    testAgentRegistry();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`\nTest Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\nTest execution error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
