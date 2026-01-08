/**
 * Test script for contract validation
 *
 * Verifies:
 * 1. Valid requests pass validation and return execution proof
 * 2. Invalid requests return 400 with validation errors
 * 3. No execution path can bypass validation
 */

const http = require('http');

const BASE_URL = 'http://localhost:8080';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== Contract Validation Tests ===\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Valid request to /v1/diligence
  console.log('Test 1: Valid GET /v1/diligence');
  try {
    const res = await makeRequest('/v1/diligence');
    if (res.status === 200 && res.body.execution_id && res.body.layers_executed) {
      console.log('  ✓ PASS: Returns 200 with execution_id and layers_executed');
      passed++;
    } else {
      console.log('  ✗ FAIL: Missing execution proof');
      console.log('    Status:', res.status);
      console.log('    Body:', JSON.stringify(res.body, null, 2));
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAIL:', e.message);
    failed++;
  }

  // Test 2: Valid request to /v1/diligence/architecture
  console.log('\nTest 2: Valid GET /v1/diligence/architecture');
  try {
    const res = await makeRequest('/v1/diligence/architecture');
    if (res.status === 200 && res.body.execution_id && res.body.layers_executed && res.body.category === 'architecture') {
      console.log('  ✓ PASS: Returns 200 with execution proof and category');
      passed++;
    } else {
      console.log('  ✗ FAIL: Invalid response');
      console.log('    Status:', res.status);
      console.log('    Body:', JSON.stringify(res.body, null, 2));
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAIL:', e.message);
    failed++;
  }

  // Test 3: Invalid path should return 400
  console.log('\nTest 3: Invalid path GET /v1/diligence/invalid');
  try {
    const res = await makeRequest('/v1/diligence/invalid');
    if (res.status === 400) {
      console.log('  ✓ PASS: Returns 400 for invalid path');
      passed++;
    } else {
      console.log('  ✗ FAIL: Should return 400');
      console.log('    Status:', res.status);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAIL:', e.message);
    failed++;
  }

  // Test 4: Health check has execution proof
  console.log('\nTest 4: Health check GET / has execution proof');
  try {
    const res = await makeRequest('/');
    if (res.status === 200 && res.body.execution_id && res.body.layers_executed) {
      console.log('  ✓ PASS: Health check includes execution proof');
      passed++;
    } else {
      console.log('  ✗ FAIL: Missing execution proof');
      console.log('    Body:', JSON.stringify(res.body, null, 2));
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAIL:', e.message);
    failed++;
  }

  // Test 5: Invalid query parameter should return 400
  console.log('\nTest 5: Invalid query param GET /v1/diligence?invalid=param');
  try {
    const res = await makeRequest('/v1/diligence?invalid=param');
    if (res.status === 400) {
      console.log('  ✓ PASS: Returns 400 for invalid query parameter');
      passed++;
    } else {
      console.log('  ✗ FAIL: Should return 400 (strict validation)');
      console.log('    Status:', res.status);
      failed++;
    }
  } catch (e) {
    console.log('  ✗ FAIL:', e.message);
    failed++;
  }

  // Test 6: All category endpoints return execution proof
  console.log('\nTest 6: All category endpoints return execution proof');
  const categories = ['benchmarks', 'narratives', 'valuation'];
  let allHaveProof = true;
  for (const cat of categories) {
    try {
      const res = await makeRequest(`/v1/diligence/${cat}`);
      if (!(res.status === 200 && res.body.execution_id && res.body.layers_executed)) {
        console.log(`  ✗ ${cat}: Missing execution proof`);
        allHaveProof = false;
      }
    } catch (e) {
      console.log(`  ✗ ${cat}: Error - ${e.message}`);
      allHaveProof = false;
    }
  }
  if (allHaveProof) {
    console.log('  ✓ PASS: All category endpoints include execution proof');
    passed++;
  } else {
    failed++;
  }

  console.log('\n=== Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
