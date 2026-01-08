/**
 * Agentics Diligence API Server
 *
 * Implements strict contract enforcement with JSON Schema validation (Ajv)
 * at the HTTP request boundary. All requests are validated before any
 * business logic executes.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const contracts = require('@agentics/contracts');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure Ajv with strict mode: no coercion, no defaults
const ajv = new Ajv({
  strict: true,
  strictTypes: true,
  strictTuples: true,
  strictRequired: true,
  allowUnionTypes: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
  allErrors: true
});
addFormats(ajv);

// Compile request schema once at startup
const validateRequest = ajv.compile(contracts.diligence.v1.request);

// Valid routes for this API
const VALID_ROUTES = new Set([
  '/v1/diligence',
  '/v1/diligence/architecture',
  '/v1/diligence/benchmarks',
  '/v1/diligence/narratives',
  '/v1/diligence/valuation'
]);

/**
 * Single validation boundary middleware.
 * ALL requests pass through this middleware BEFORE any business logic.
 * If validation fails, returns 400 immediately with no further processing.
 */
function contractValidationMiddleware(req, res, next) {
  // Build the request object to validate against schema
  // Use baseUrl + path to get the full path (since middleware is mounted at /v1/diligence)
  const fullPath = req.baseUrl + req.path;
  const requestToValidate = {
    method: req.method,
    path: fullPath,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    headers: req.headers ? {
      'content-type': req.headers['content-type'],
      'accept': req.headers['accept']
    } : undefined,
    body: req.body && Object.keys(req.body).length > 0 ? req.body : null
  };

  // Remove undefined properties to avoid schema validation issues
  Object.keys(requestToValidate).forEach(key => {
    if (requestToValidate[key] === undefined) {
      delete requestToValidate[key];
    }
  });

  // Validate against the contract schema
  const valid = validateRequest(requestToValidate);

  if (!valid) {
    // Validation failed - return 400 immediately, no business logic executes
    return res.status(400).json({
      error: 'Request validation failed',
      details: validateRequest.errors.map(err => ({
        path: err.instancePath,
        message: err.message,
        params: err.params
      }))
    });
  }

  // Validation passed - proceed to route handlers
  next();
}

/**
 * Generate execution proof for successful responses.
 * Every successful response MUST include execution_id and either
 * layers_executed or execution_graph as defined by the contracts.
 */
function generateExecutionProof(layers) {
  return {
    execution_id: uuidv4(),
    layers_executed: layers
  };
}

// Apply JSON body parser
app.use(express.json());

// Apply contract validation middleware to ALL /v1/diligence routes
// This is the SINGLE validation boundary - no requests can bypass it
app.use('/v1/diligence', contractValidationMiddleware);

// Health check endpoint (outside validation boundary - simple health probe)
app.get('/', (req, res) => {
  const proof = generateExecutionProof(['health-check']);
  res.json({
    status: 'healthy',
    service: 'agentics-diligence',
    ...proof
  });
});

// Main diligence index endpoint
app.get('/v1/diligence', (req, res) => {
  const proof = generateExecutionProof(['request-validation', 'index-generation']);
  res.json({
    service: 'agentics-diligence',
    version: '1.0.0',
    description: 'Agentics Diligence Artifacts API',
    endpoints: {
      index: '/v1/diligence',
      architecture: '/v1/diligence/architecture',
      benchmarks: '/v1/diligence/benchmarks',
      narratives: '/v1/diligence/narratives',
      valuation: '/v1/diligence/valuation'
    },
    ...proof
  });
});

// Architecture endpoint
app.get('/v1/diligence/architecture', (req, res) => {
  const archPath = path.join(__dirname, '..', 'architecture');
  try {
    const files = fs.readdirSync(archPath, { recursive: true });
    const proof = generateExecutionProof(['request-validation', 'filesystem-read', 'filter-markdown']);
    res.json({
      category: 'architecture',
      files: files.filter(f => typeof f === 'string' && f.endsWith('.md')),
      ...proof
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read architecture files',
      execution_id: uuidv4()
    });
  }
});

// Benchmarks endpoint
app.get('/v1/diligence/benchmarks', (req, res) => {
  const benchPath = path.join(__dirname, '..', 'benchmarks');
  try {
    const files = fs.readdirSync(benchPath, { recursive: true });
    const proof = generateExecutionProof(['request-validation', 'filesystem-read', 'enumerate-files']);
    res.json({
      category: 'benchmarks',
      files: files.filter(f => typeof f === 'string'),
      ...proof
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read benchmark files',
      execution_id: uuidv4()
    });
  }
});

// Narratives endpoint
app.get('/v1/diligence/narratives', (req, res) => {
  const narrPath = path.join(__dirname, '..', 'narratives');
  try {
    const files = fs.readdirSync(narrPath, { recursive: true });
    const proof = generateExecutionProof(['request-validation', 'filesystem-read', 'filter-markdown']);
    res.json({
      category: 'narratives',
      files: files.filter(f => typeof f === 'string' && f.endsWith('.md')),
      ...proof
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read narrative files',
      execution_id: uuidv4()
    });
  }
});

// Valuation endpoint
app.get('/v1/diligence/valuation', (req, res) => {
  const valPath = path.join(__dirname, '..', 'valuation');
  try {
    const files = fs.readdirSync(valPath, { recursive: true });
    const proof = generateExecutionProof(['request-validation', 'filesystem-read', 'filter-markdown']);
    res.json({
      category: 'valuation',
      files: files.filter(f => typeof f === 'string' && f.endsWith('.md')),
      ...proof
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read valuation files',
      execution_id: uuidv4()
    });
  }
});

// Catch-all for undefined routes under /v1/diligence
// Returns 400 for invalid paths (validation already handles this via schema)
app.use('/v1/diligence/*', (req, res) => {
  res.status(400).json({
    error: 'Invalid endpoint path',
    execution_id: uuidv4()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agentics Diligence API listening on port ${PORT}`);
  console.log('Contract validation: ENABLED (strict mode, no coercion, no defaults)');
  console.log('Validation boundary: /v1/diligence/*');
});
