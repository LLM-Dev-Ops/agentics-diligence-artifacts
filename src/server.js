const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'healthy', service: 'agentics-diligence' });
});

// Main diligence endpoint
app.get('/v1/diligence', (req, res) => {
  const artifacts = {
    service: 'agentics-diligence',
    version: '1.0.0',
    description: 'Agentics Diligence Artifacts API',
    endpoints: {
      index: '/v1/diligence',
      architecture: '/v1/diligence/architecture',
      benchmarks: '/v1/diligence/benchmarks',
      narratives: '/v1/diligence/narratives',
      valuation: '/v1/diligence/valuation'
    }
  };
  res.json(artifacts);
});

// Architecture endpoint
app.get('/v1/diligence/architecture', (req, res) => {
  const archPath = path.join(__dirname, '..', 'architecture');
  try {
    const files = fs.readdirSync(archPath, { recursive: true });
    res.json({
      category: 'architecture',
      files: files.filter(f => f.endsWith('.md'))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read architecture files' });
  }
});

// Benchmarks endpoint
app.get('/v1/diligence/benchmarks', (req, res) => {
  const benchPath = path.join(__dirname, '..', 'benchmarks');
  try {
    const files = fs.readdirSync(benchPath, { recursive: true });
    res.json({
      category: 'benchmarks',
      files: files
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read benchmark files' });
  }
});

// Narratives endpoint
app.get('/v1/diligence/narratives', (req, res) => {
  const narrPath = path.join(__dirname, '..', 'narratives');
  try {
    const files = fs.readdirSync(narrPath, { recursive: true });
    res.json({
      category: 'narratives',
      files: files.filter(f => f.endsWith('.md'))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read narrative files' });
  }
});

// Valuation endpoint
app.get('/v1/diligence/valuation', (req, res) => {
  const valPath = path.join(__dirname, '..', 'valuation');
  try {
    const files = fs.readdirSync(valPath, { recursive: true });
    res.json({
      category: 'valuation',
      files: files.filter(f => f.endsWith('.md'))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read valuation files' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agentics Diligence API listening on port ${PORT}`);
});
