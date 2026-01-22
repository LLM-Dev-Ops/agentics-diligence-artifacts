#!/usr/bin/env node
/**
 * Agentics Diligence Documentation CLI
 *
 * CLI entry point for the Documentation Generator Agent.
 *
 * Commands:
 * - generate: Generate documentation from platform events
 * - inspect: Inspect generated documentation artifacts
 * - templates: List available documentation templates
 *
 * Usage:
 *   node src/cli.js generate --type <artifact-type> --audience <audience>
 *   node src/cli.js inspect --artifact-id <id>
 *   node src/cli.js templates
 *
 * Environment Variables:
 *   RUVECTOR_SERVICE_URL: URL of ruvector-service (default: http://localhost:8080)
 *   LLM_OBSERVATORY_URL: URL of LLM Observatory (default: http://localhost:9090)
 *   LLM_OBSERVATORY_ENABLED: Enable/disable telemetry (default: true)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createDocumentationGeneratorAgent, AGENT_ID, AGENT_VERSION } = require('./agents/documentation-generator-agent');
const { createRuVectorClient } = require('./clients/ruvector-client');
const { getDefaultEmitter } = require('./telemetry/llm-observatory');
const templates = require('./templates');

// CLI version
const CLI_VERSION = '1.0.0';

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const parsed = {
    command: null,
    options: {}
  };

  let i = 0;
  if (args[0] && !args[0].startsWith('--')) {
    parsed.command = args[0];
    i = 1;
  }

  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsed.options[key] = nextArg;
        i += 2;
      } else {
        parsed.options[key] = true;
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  return parsed;
}

/**
 * Read input from file
 */
function readInputFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Input file not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Handle the 'generate' command
 */
async function handleGenerate(options) {
  const artifactType = options.type || options['artifact-type'];
  const audience = options.audience;

  if (!artifactType) {
    console.error('Error: --type is required');
    console.error('Available types: diligence_report, executive_summary, technical_assessment, risk_report, compliance_report, audit_package, governance_memo, investment_memo, architecture_overview, decision_log');
    return 1;
  }

  if (!audience) {
    console.error('Error: --audience is required');
    console.error('Available audiences: executive, technical, compliance, investor, auditor, board');
    return 1;
  }

  // Build input
  let input;
  if (options.input) {
    input = readInputFile(options.input);
  } else {
    input = {
      request_id: uuidv4(),
      artifact_type: artifactType,
      audience: audience,
      format: options.format || 'markdown',
      scope: options.scope || 'full',
      classification: options.classification || 'internal',
      metadata: {
        project_name: options.project || 'Agentics Platform',
        prepared_for: options['prepared-for'] || audience,
        version: options.version || '1.0'
      }
    };

    // Add timeframe if provided
    if (options.from || options.to) {
      input.timeframe = {};
      if (options.from) input.timeframe.from = options.from;
      if (options.to) input.timeframe.to = options.to;
    }

    // Add source query if provided
    if (options['event-types'] || options['agent-ids']) {
      input.source_query = {};
      if (options['event-types']) {
        input.source_query.event_types = options['event-types'].split(',');
      }
      if (options['agent-ids']) {
        input.source_query.agent_ids = options['agent-ids'].split(',');
      }
    }
  }

  console.log(`[CLI] Generating ${artifactType} for ${audience} audience...`);

  const agent = createDocumentationGeneratorAgent();

  try {
    const result = await agent.generate(input);

    if (options.output) {
      // Write to file
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, result.output.artifact.content, 'utf-8');
      console.log(`[CLI] Documentation written to: ${outputPath}`);
    }

    const summary = {
      success: true,
      artifact_id: result.output.artifact.artifact_id,
      artifact_type: result.output.artifact.artifact_type,
      format: result.output.artifact.format,
      title: result.output.artifact.title,
      sections_generated: result.output.generation_stats.sections_generated,
      word_count: result.output.generation_stats.total_word_count,
      source_events_processed: result.output.generation_stats.source_events_processed,
      completeness: result.output.quality_metrics.overall_completeness,
      data_coverage: result.output.quality_metrics.data_coverage,
      gaps: result.output.quality_metrics.gaps_identified.length,
      stored: result.output.storage.stored,
      storage_ref: result.output.storage.storage_ref,
      execution_ref: result.decisionEvent.execution_ref
    };

    if (options.verbose) {
      summary.full_output = result.output;
      summary.decision_event = result.decisionEvent;
    }

    if (options.content) {
      console.log('\n--- Generated Documentation ---\n');
      console.log(result.output.artifact.content);
      console.log('\n--- End Documentation ---\n');
    }

    console.log(JSON.stringify(summary, null, 2));
    return 0;

  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message,
      error_type: error.name,
      validation_errors: error.errors || null
    }, null, 2));
    return 1;
  }
}

/**
 * Handle the 'inspect' command
 */
async function handleInspect(options) {
  const artifactId = options['artifact-id'] || options.id;

  if (!artifactId) {
    // List recent artifacts
    console.log('[CLI] Listing recent documentation artifacts...');
    const client = createRuVectorClient();

    try {
      const artifacts = await client.listDocumentationArtifacts({
        limit: options.limit ? parseInt(options.limit) : 20
      });

      console.log(JSON.stringify({
        success: true,
        count: artifacts.length,
        artifacts: artifacts.map(a => ({
          artifact_id: a.artifact_id,
          artifact_type: a.artifact_type,
          title: a.metadata?.title,
          generated_at: a.metadata?.generated_at
        }))
      }, null, 2));
      return 0;

    } catch (error) {
      console.error(JSON.stringify({
        success: false,
        error: error.message,
        note: 'RuVector service may not be available'
      }, null, 2));
      return 1;
    }
  }

  // Retrieve specific artifact
  console.log(`[CLI] Retrieving artifact: ${artifactId}`);
  const client = createRuVectorClient();

  try {
    const artifact = await client.retrieveDocumentationArtifact(artifactId);

    if (!artifact) {
      console.error(JSON.stringify({
        success: false,
        error: 'Artifact not found',
        artifact_id: artifactId
      }, null, 2));
      return 1;
    }

    if (options.content) {
      console.log(artifact.content);
    } else {
      console.log(JSON.stringify({
        success: true,
        artifact
      }, null, 2));
    }
    return 0;

  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
    return 1;
  }
}

/**
 * Handle the 'templates' command
 */
function handleTemplates() {
  const allTemplates = templates.getAllTemplates();

  console.log(JSON.stringify({
    success: true,
    templates: allTemplates.map(t => ({
      type: t.type,
      name: t.name,
      template_id: t.id,
      sections: t.sections.map(s => ({
        id: s.id,
        title: s.title,
        required: s.required
      }))
    }))
  }, null, 2));

  return 0;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Agentics Diligence Documentation CLI v${CLI_VERSION}

Agent: ${AGENT_ID} v${AGENT_VERSION}
Classification: DOCUMENTATION GENERATION

USAGE:
  node src/cli.js <command> [options]

COMMANDS:
  generate    Generate documentation from platform events
  inspect     Inspect generated documentation artifacts
  templates   List available documentation templates
  help        Show this help message

GENERATE OPTIONS:
  --type <type>            Artifact type (required)
  --audience <audience>    Target audience (required)
  --format <format>        Output format (markdown, json, html) [default: markdown]
  --scope <scope>          Generation scope (full, summary, section) [default: full]
  --classification <level> Classification (public, internal, confidential) [default: internal]
  --input <file>           Read input from JSON file
  --output <file>          Write documentation to file
  --from <timestamp>       Filter events from timestamp
  --to <timestamp>         Filter events to timestamp
  --event-types <types>    Comma-separated event types to include
  --project <name>         Project name for documentation
  --prepared-for <name>    Recipient name
  --content                Print generated content to stdout
  --verbose                Include full output in response

INSPECT OPTIONS:
  --artifact-id <id>       Artifact ID to retrieve
  --limit <n>              Max artifacts to list [default: 20]
  --content                Print artifact content

ARTIFACT TYPES:
  diligence_report, executive_summary, technical_assessment,
  risk_report, compliance_report, audit_package, governance_memo,
  investment_memo, architecture_overview, decision_log

AUDIENCES:
  executive, technical, compliance, investor, auditor, board

EXAMPLES:
  # Generate a diligence report for investors
  node src/cli.js generate --type diligence_report --audience investor --output report.md

  # Generate executive summary
  node src/cli.js generate --type executive_summary --audience board --content

  # List available templates
  node src/cli.js templates

  # Inspect a generated artifact
  node src/cli.js inspect --artifact-id <uuid>

  # List recent artifacts
  node src/cli.js inspect --limit 10

ENVIRONMENT VARIABLES:
  RUVECTOR_SERVICE_URL      URL of ruvector-service (default: http://localhost:8080)
  LLM_OBSERVATORY_URL       URL of LLM Observatory (default: http://localhost:9090)
  LLM_OBSERVATORY_ENABLED   Enable telemetry (default: true)
`);
  return 0;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  let exitCode = 0;

  try {
    switch (command) {
      case 'generate':
        exitCode = await handleGenerate(options);
        break;
      case 'inspect':
        exitCode = await handleInspect(options);
        break;
      case 'templates':
        exitCode = handleTemplates();
        break;
      case 'help':
      case null:
        exitCode = showHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        exitCode = showHelp();
        exitCode = 1;
    }
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, null, 2));
    exitCode = 1;
  }

  // Flush telemetry
  const telemetry = getDefaultEmitter();
  await telemetry.shutdown();

  process.exit(exitCode);
}

// Run CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
