#!/usr/bin/env npx ts-node
/**
 * Synthesis Layer Entry Point
 *
 * Converts Agentics CLI JSON outputs into board-ready executive decision memos.
 *
 * Usage:
 *   npx ts-node synthesis/index.ts --objective "..." --command "..." --input file.json
 *   agentics simulate | npx ts-node synthesis/index.ts --objective "..." --command "agentics simulate"
 *
 * Environment variables:
 *   OPENAI_API_KEY or ANTHROPIC_API_KEY - Required for LLM calls
 *   LLM_BASE_URL - Optional custom endpoint
 *   LLM_MODEL - Optional model override
 */

import * as fs from 'fs';
import { DecisionInput, validateDecisionInput } from './decision_input';
import { synthesize } from './synthesizer';
import { writeDecisionSummary } from './render_markdown';

interface CLIArgs {
  objective?: string;
  command?: string;
  input?: string;
  output?: string;
  precedent?: string;
  help?: boolean;
}

function printUsage(): void {
  console.log(`
Synthesis Layer - Convert CLI outputs to executive decision memos

Usage:
  npx ts-node synthesis/index.ts [options]

Options:
  --objective <text>   Business objective being evaluated (required)
  --command <text>     CLI command that was executed (required)
  --input <file>       JSON file containing CLI output (or pipe via stdin)
  --output <file>      Output path (default: decision-summary.md)
  --precedent <file>   Optional precedent data for comparison
  --help               Show this help message

Environment:
  OPENAI_API_KEY       API key for OpenAI (or ANTHROPIC_API_KEY for Claude)
  LLM_BASE_URL         Optional custom LLM endpoint
  LLM_MODEL            Optional model override

Examples:
  # From file
  npx ts-node synthesis/index.ts \\
    --objective "Evaluate deployment readiness" \\
    --command "agentics simulate" \\
    --input simulation-output.json

  # From stdin (pipe)
  agentics simulate | npx ts-node synthesis/index.ts \\
    --objective "Evaluate deployment readiness" \\
    --command "agentics simulate"
`);
}

function parseArgs(args: string[]): CLIArgs {
  const result: CLIArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--objective':
        result.objective = next;
        i++;
        break;
      case '--command':
        result.command = next;
        i++;
        break;
      case '--input':
        result.input = next;
        i++;
        break;
      case '--output':
        result.output = next;
        i++;
        break;
      case '--precedent':
        result.precedent = next;
        i++;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    const timeout = setTimeout(() => {
      if (!data) {
        resolve('');
      }
    }, 100);

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      clearTimeout(timeout);
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(data);
    });
    process.stdin.on('error', reject);

    // Check if stdin is not a TTY (i.e., data is being piped)
    if (process.stdin.isTTY) {
      clearTimeout(timeout);
      resolve('');
    }
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  // Validate required arguments
  if (!args.objective) {
    console.error('Error: --objective is required');
    printUsage();
    process.exit(1);
  }

  if (!args.command) {
    console.error('Error: --command is required');
    printUsage();
    process.exit(1);
  }

  // Get raw output from file or stdin
  let rawOutput: unknown;

  if (args.input) {
    try {
      const content = fs.readFileSync(args.input, 'utf-8');
      rawOutput = JSON.parse(content);
    } catch (err) {
      console.error(`Error reading input file: ${err}`);
      process.exit(1);
    }
  } else {
    // Try reading from stdin
    const stdinData = await readStdin();
    if (stdinData) {
      try {
        rawOutput = JSON.parse(stdinData);
      } catch {
        // If not JSON, treat as raw string
        rawOutput = stdinData;
      }
    } else {
      console.error('Error: No input provided. Use --input or pipe data via stdin.');
      printUsage();
      process.exit(1);
    }
  }

  // Load precedent if provided
  let precedent: unknown;
  if (args.precedent) {
    try {
      const content = fs.readFileSync(args.precedent, 'utf-8');
      precedent = JSON.parse(content);
    } catch (err) {
      console.error(`Warning: Could not read precedent file: ${err}`);
    }
  }

  // Build decision input
  const decisionInput: DecisionInput = {
    objective: args.objective,
    command: args.command,
    raw_output: rawOutput,
    precedent,
  };

  if (!validateDecisionInput(decisionInput)) {
    console.error('Error: Invalid decision input structure');
    process.exit(1);
  }

  // Run synthesis
  console.error('Synthesizing decision memo...');

  try {
    const result = await synthesize(decisionInput);
    const markdown = writeDecisionSummary(result, args.output);

    // Output to stdout
    console.log(markdown);

    const outputPath = args.output || 'decision-summary.md';
    console.error(`\nDecision summary written to: ${outputPath}`);
  } catch (err) {
    console.error(`Synthesis failed: ${err}`);
    process.exit(1);
  }
}

// Export for programmatic use
export {
  DecisionInput,
  SynthesisResult,
  LegacySynthesisResult,
  ExtractedEvidence,
  PolicyViolation,
  CostVariance,
  FailureRate,
  LatencyImpact,
  BindingConstraint,
  MicroDistribution,
  RecommendationDisposition,
  ExecutiveContext,
  DecisionFraming,
  Recommendation,
  RisksAndTradeoffs,
  Constraints,
  ERPResolution,
  DecisionDisplacement,
  MicroMacroNarrative,
  NextActions,
  validateDecisionInput,
} from './decision_input';
export { synthesize, synthesizeLegacy } from './synthesizer';
export { renderMarkdown, renderLegacyMarkdown, writeDecisionSummary } from './render_markdown';
export {
  extractEvidence,
  extractDecisionFraming,
  determineRecommendation,
  buildRecommendationStatement,
  extractRisksAndTradeoffs,
  detectConstraints,
  generateDecisionDisplacement,
  buildMicroMacroNarrative,
} from './extraction';
export {
  validateQuality,
  enforceQuality,
  enforceDeclarativeSentences,
  tightenRecommendation,
  enforceQualityOnObject,
  enforceRecommendationQuality,
  enforceRationaleQuality,
  enforceContextQuality,
  enforceExecutiveQuality,
  QualityViolation,
  QualityReport,
} from './language_quality';

// Run if called directly
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
