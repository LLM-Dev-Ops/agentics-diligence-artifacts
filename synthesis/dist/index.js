#!/usr/bin/env npx ts-node
"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceExecutiveQuality = exports.enforceContextQuality = exports.enforceRationaleQuality = exports.enforceRecommendationQuality = exports.enforceQualityOnObject = exports.tightenRecommendation = exports.enforceDeclarativeSentences = exports.enforceQuality = exports.validateQuality = exports.buildMicroMacroNarrative = exports.generateDecisionDisplacement = exports.detectConstraints = exports.extractRisksAndTradeoffs = exports.buildRecommendationStatement = exports.determineRecommendation = exports.extractDecisionFraming = exports.extractEvidence = exports.writeDecisionSummary = exports.renderLegacyMarkdown = exports.renderMarkdown = exports.synthesizeLegacy = exports.synthesize = exports.validateDecisionInput = void 0;
const fs = __importStar(require("fs"));
const decision_input_1 = require("./decision_input");
const synthesizer_1 = require("./synthesizer");
const render_markdown_1 = require("./render_markdown");
function printUsage() {
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
function parseArgs(args) {
    const result = {};
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
async function readStdin() {
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
async function main() {
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
    let rawOutput;
    if (args.input) {
        try {
            const content = fs.readFileSync(args.input, 'utf-8');
            rawOutput = JSON.parse(content);
        }
        catch (err) {
            console.error(`Error reading input file: ${err}`);
            process.exit(1);
        }
    }
    else {
        // Try reading from stdin
        const stdinData = await readStdin();
        if (stdinData) {
            try {
                rawOutput = JSON.parse(stdinData);
            }
            catch {
                // If not JSON, treat as raw string
                rawOutput = stdinData;
            }
        }
        else {
            console.error('Error: No input provided. Use --input or pipe data via stdin.');
            printUsage();
            process.exit(1);
        }
    }
    // Load precedent if provided
    let precedent;
    if (args.precedent) {
        try {
            const content = fs.readFileSync(args.precedent, 'utf-8');
            precedent = JSON.parse(content);
        }
        catch (err) {
            console.error(`Warning: Could not read precedent file: ${err}`);
        }
    }
    // Build decision input
    const decisionInput = {
        objective: args.objective,
        command: args.command,
        raw_output: rawOutput,
        precedent,
    };
    if (!(0, decision_input_1.validateDecisionInput)(decisionInput)) {
        console.error('Error: Invalid decision input structure');
        process.exit(1);
    }
    // Run synthesis
    console.error('Synthesizing decision memo...');
    try {
        const result = await (0, synthesizer_1.synthesize)(decisionInput);
        const markdown = (0, render_markdown_1.writeDecisionSummary)(result, args.output);
        // Output to stdout
        console.log(markdown);
        const outputPath = args.output || 'decision-summary.md';
        console.error(`\nDecision summary written to: ${outputPath}`);
    }
    catch (err) {
        console.error(`Synthesis failed: ${err}`);
        process.exit(1);
    }
}
// Export for programmatic use
var decision_input_2 = require("./decision_input");
Object.defineProperty(exports, "validateDecisionInput", { enumerable: true, get: function () { return decision_input_2.validateDecisionInput; } });
var synthesizer_2 = require("./synthesizer");
Object.defineProperty(exports, "synthesize", { enumerable: true, get: function () { return synthesizer_2.synthesize; } });
Object.defineProperty(exports, "synthesizeLegacy", { enumerable: true, get: function () { return synthesizer_2.synthesizeLegacy; } });
var render_markdown_2 = require("./render_markdown");
Object.defineProperty(exports, "renderMarkdown", { enumerable: true, get: function () { return render_markdown_2.renderMarkdown; } });
Object.defineProperty(exports, "renderLegacyMarkdown", { enumerable: true, get: function () { return render_markdown_2.renderLegacyMarkdown; } });
Object.defineProperty(exports, "writeDecisionSummary", { enumerable: true, get: function () { return render_markdown_2.writeDecisionSummary; } });
var extraction_1 = require("./extraction");
Object.defineProperty(exports, "extractEvidence", { enumerable: true, get: function () { return extraction_1.extractEvidence; } });
Object.defineProperty(exports, "extractDecisionFraming", { enumerable: true, get: function () { return extraction_1.extractDecisionFraming; } });
Object.defineProperty(exports, "determineRecommendation", { enumerable: true, get: function () { return extraction_1.determineRecommendation; } });
Object.defineProperty(exports, "buildRecommendationStatement", { enumerable: true, get: function () { return extraction_1.buildRecommendationStatement; } });
Object.defineProperty(exports, "extractRisksAndTradeoffs", { enumerable: true, get: function () { return extraction_1.extractRisksAndTradeoffs; } });
Object.defineProperty(exports, "detectConstraints", { enumerable: true, get: function () { return extraction_1.detectConstraints; } });
Object.defineProperty(exports, "generateDecisionDisplacement", { enumerable: true, get: function () { return extraction_1.generateDecisionDisplacement; } });
Object.defineProperty(exports, "buildMicroMacroNarrative", { enumerable: true, get: function () { return extraction_1.buildMicroMacroNarrative; } });
var language_quality_1 = require("./language_quality");
Object.defineProperty(exports, "validateQuality", { enumerable: true, get: function () { return language_quality_1.validateQuality; } });
Object.defineProperty(exports, "enforceQuality", { enumerable: true, get: function () { return language_quality_1.enforceQuality; } });
Object.defineProperty(exports, "enforceDeclarativeSentences", { enumerable: true, get: function () { return language_quality_1.enforceDeclarativeSentences; } });
Object.defineProperty(exports, "tightenRecommendation", { enumerable: true, get: function () { return language_quality_1.tightenRecommendation; } });
Object.defineProperty(exports, "enforceQualityOnObject", { enumerable: true, get: function () { return language_quality_1.enforceQualityOnObject; } });
Object.defineProperty(exports, "enforceRecommendationQuality", { enumerable: true, get: function () { return language_quality_1.enforceRecommendationQuality; } });
Object.defineProperty(exports, "enforceRationaleQuality", { enumerable: true, get: function () { return language_quality_1.enforceRationaleQuality; } });
Object.defineProperty(exports, "enforceContextQuality", { enumerable: true, get: function () { return language_quality_1.enforceContextQuality; } });
Object.defineProperty(exports, "enforceExecutiveQuality", { enumerable: true, get: function () { return language_quality_1.enforceExecutiveQuality; } });
// Run if called directly
main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
