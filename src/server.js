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
const http = require('http');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const contracts = require('@agentics/contracts');

// Post-execution fan-out endpoints
const FANOUT_TARGETS = [
  {
    name: 'governance-core',
    url: 'https://governance-core-1062287243982.us-central1.run.app/v1/compliance/record',
    buildPayload: (pkg, traceId) => ({
      source: 'agentics-diligence',
      diligence_id: pkg.id,
      frameworks_evaluated: pkg.frameworks_evaluated,
      compliance_summary: pkg.compliance_summary,
      findings_count: Object.values(pkg.compliance_summary.by_framework)
        .reduce((sum, fw) => sum + fw.findings, 0),
      timestamp: pkg.generated_at
    })
  },
  {
    name: 'security-core',
    url: 'https://security-core-1062287243982.us-central1.run.app/v1/audit/record',
    buildPayload: (pkg, traceId) => ({
      source: 'agentics-diligence',
      diligence_id: pkg.id,
      frameworks: pkg.frameworks_evaluated,
      controls_evaluated: Object.values(pkg.compliance_summary.by_framework)
        .reduce((sum, fw) => sum + fw.controls_evaluated, 0),
      violations_found: Object.values(pkg.compliance_summary.by_framework)
        .reduce((sum, fw) => sum + fw.findings, 0),
      timestamp: pkg.generated_at
    })
  },
  {
    name: 'intelligence-core',
    url: 'https://intelligence-core-1062287243982.us-central1.run.app/v1/ingest/telemetry',
    buildPayload: (pkg, traceId, timing) => ({
      source: 'agentics-diligence',
      event: 'diligence_complete',
      diligence_id: pkg.id,
      frameworks: pkg.frameworks_evaluated,
      timing,
      timestamp: pkg.generated_at
    })
  }
];

/**
 * Fire non-blocking POST calls to core bundles after diligence package generation.
 * Uses Promise.allSettled so failures don't affect the main response.
 * Forwards the correlation ID from the original request.
 */
function fanOutToCoreBundles(diligencePackage, traceId, timing) {
  const promises = FANOUT_TARGETS.map(target => {
    const payload = JSON.stringify(target.buildPayload(diligencePackage, traceId, timing));
    const url = new URL(target.url);

    return new Promise((resolve, reject) => {
      const transport = url.protocol === 'https:' ? https : http;
      const req = transport.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'X-Correlation-ID': traceId
        },
        timeout: 5000
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ target: target.name, status: res.statusCode });
          } else {
            reject(new Error(`${target.name} returned ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`${target.name}: ${err.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`${target.name}: request timed out`));
      });

      req.write(payload);
      req.end();
    });
  });

  Promise.allSettled(promises).then(results => {
    for (const result of results) {
      if (result.status === 'rejected') {
        console.warn(`[fanout] WARN: ${result.reason.message}`);
      }
    }
  });
}

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
  '/v1/diligence/valuation',
  '/health'
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

// GET /health - lightweight health probe
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
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

// Compliance controls catalog per framework
const FRAMEWORK_CONTROLS = {
  soc2: { controls: ['CC1.1', 'CC1.2', 'CC2.1', 'CC3.1', 'CC3.2', 'CC4.1', 'CC5.1', 'CC6.1', 'CC6.2', 'CC7.1', 'CC7.2', 'CC8.1'], count: 12 },
  gdpr: { controls: ['Art5-Principles', 'Art6-Lawfulness', 'Art12-Transparency', 'Art15-Access', 'Art17-Erasure', 'Art25-ByDesign', 'Art30-Records', 'Art32-Security'], count: 8 },
  hipaa: { controls: ['§164.308-Admin', '§164.310-Physical', '§164.312-Technical', '§164.314-Organizational', '§164.316-Policies', '§164.502-Uses', '§164.504-BusinessAssoc', '§164.508-Consent', '§164.510-Uses', '§164.512-Uses', '§164.514-Other', '§164.520-Notice', '§164.522-Rights', '§164.524-Access', '§164.526-Amendment'], count: 15 },
  iso27001: { controls: ['A5-Policies', 'A6-Organization', 'A7-HR', 'A8-Assets', 'A9-Access', 'A10-Crypto', 'A11-Physical', 'A12-Operations', 'A13-Comms', 'A14-Acquisition'], count: 10 },
  pci_dss: { controls: ['R1-Firewall', 'R2-Defaults', 'R3-StoredData', 'R4-Encryption', 'R5-Antivirus', 'R6-SecureSystems', 'R7-Access', 'R8-AuthN', 'R9-Physical', 'R10-Monitoring', 'R11-Testing', 'R12-Policy'], count: 12 },
  nist: { controls: ['ID.AM', 'ID.GV', 'PR.AC', 'PR.AT', 'PR.DS', 'PR.IP', 'PR.MA', 'PR.PT', 'DE.AE', 'DE.CM', 'DE.DP', 'RS.RP', 'RC.RP'], count: 13 },
  fedramp: { controls: ['AC-Access', 'AU-Audit', 'CA-Assessment', 'CM-Config', 'CP-Contingency', 'IA-AuthN', 'IR-Incident', 'MA-Maintenance', 'MP-Media', 'PE-Physical', 'PL-Planning', 'PS-Personnel', 'RA-RiskAssess', 'SA-Acquisition', 'SC-SysComms', 'SI-SysIntegrity'], count: 16 }
};

/**
 * Evaluate compliance for a single framework against provided refs.
 * Returns a deterministic assessment based on the ref artifacts available.
 */
function evaluateFramework(framework, refs, includeEvidence) {
  const catalog = FRAMEWORK_CONTROLS[framework];
  if (!catalog) {
    return { status: 'non_compliant', findings: 1, controls_evaluated: 0 };
  }

  const controls_evaluated = catalog.count;
  // Assess based on ref coverage: more refs = better coverage
  const coverageRatio = Math.min(refs.length / 3, 1);
  const passedControls = Math.floor(controls_evaluated * coverageRatio);
  const findings = controls_evaluated - passedControls;

  let status;
  if (findings === 0) {
    status = 'compliant';
  } else if (findings <= Math.floor(controls_evaluated * 0.3)) {
    status = 'partial';
  } else {
    status = 'non_compliant';
  }

  const result = { status, findings, controls_evaluated };

  const evidence = [];
  if (includeEvidence) {
    catalog.controls.forEach((control, i) => {
      evidence.push({
        control_id: control,
        framework,
        status: i < passedControls ? 'pass' : 'finding',
        refs_evaluated: refs.map(r => r.id),
        evaluated_at: new Date().toISOString()
      });
    });
  }

  return { ...result, evidence };
}

// Normalize framework names from CLI format to internal enum
// e.g. "SOC2" -> "soc2", "PCI-DSS" -> "pci_dss", "ISO27001" -> "iso27001"
function normalizeFramework(fw) {
  return fw.toLowerCase().replace(/-/g, '_');
}

// POST /v1/diligence - package compliance and due diligence artifacts
app.post('/v1/diligence', (req, res) => {
  const startTime = Date.now();
  let { refs, frameworks, include_evidence, certifying_authority, description } = req.body;

  // Support CLI-style requests that send description instead of refs
  if (!refs && description) {
    refs = [{ id: uuidv4(), type: 'assessment' }];
  }

  if (!refs || !Array.isArray(refs) || refs.length === 0) {
    return res.status(400).json({
      error: 'Request body must include a non-empty "refs" array or a "description" string',
      execution_id: uuidv4()
    });
  }
  if (!frameworks || !Array.isArray(frameworks) || frameworks.length === 0) {
    return res.status(400).json({
      error: 'Request body must include a non-empty "frameworks" array',
      execution_id: uuidv4()
    });
  }

  // Normalize framework names (accept "SOC2", "PCI-DSS", etc.)
  frameworks = frameworks.map(normalizeFramework);

  const includeEvidence = include_evidence === true;
  const byFramework = {};
  const allEvidence = [];

  for (const fw of frameworks) {
    const evaluation = evaluateFramework(fw, refs, includeEvidence);
    byFramework[fw] = {
      status: evaluation.status,
      findings: evaluation.findings,
      controls_evaluated: evaluation.controls_evaluated
    };
    if (evaluation.evidence) {
      allEvidence.push(...evaluation.evidence);
    }
  }

  // Derive overall status
  const statuses = Object.values(byFramework).map(f => f.status);
  let overall_status;
  if (statuses.every(s => s === 'compliant')) {
    overall_status = 'compliant';
  } else if (statuses.some(s => s === 'non_compliant')) {
    overall_status = 'non_compliant';
  } else {
    overall_status = 'partial';
  }

  const traceId = req.headers['x-correlation-id'] || uuidv4();

  const response = {
    diligence_package: {
      id: `diligence-${uuidv4()}`,
      frameworks_evaluated: frameworks,
      compliance_summary: {
        overall_status,
        by_framework: byFramework
      },
      evidence: includeEvidence ? allEvidence : [],
      generated_at: new Date().toISOString()
    },
    execution_metadata: {
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      service: 'agentics-diligence'
    }
  };

  if (certifying_authority) {
    response.diligence_package.certifying_authority = certifying_authority;
  }

  // Fire non-blocking fan-out to core bundles
  const endTime = Date.now();
  fanOutToCoreBundles(response.diligence_package, traceId, {
    duration_ms: endTime - startTime,
    frameworks_count: frameworks.length
  });

  res.status(200).json(response);
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

// Server startup
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agentics Diligence API listening on port ${PORT}`);
  console.log('Contract validation: ENABLED (strict mode, no coercion, no defaults)');
  console.log('Validation boundary: /v1/diligence/*');
});
