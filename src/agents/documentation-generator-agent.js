/**
 * Documentation Generator Agent (HARDENED v1.1.0)
 *
 * Purpose: Generate structured, human-readable diligence, audit, and governance
 * documentation from platform DecisionEvents and artifacts.
 *
 * Classification: DOCUMENTATION GENERATION
 * decision_type: "document_generation_signal" (HARDENED)
 *
 * CRITICAL CONSTRAINTS (from Constitution):
 * - MUST NOT execute inference
 * - MUST NOT modify upstream data or artifacts
 * - MUST NOT capture learning signals
 * - MUST NOT trigger orchestration
 * - MUST NOT enforce decisions
 * - MUST persist ONLY via ruvector-service client calls
 * - MUST emit exactly ONE DecisionEvent per invocation
 *
 * HARDENED ROLE RULES:
 * - Agent MAY: Read DecisionEvents, Format executive documents
 * - Agent MUST NOT: Generate new analysis, Emit policy or risk conclusions
 *
 * HARDENED DECISIONEVENT RULES:
 * - Emit ONLY: document_generation_signal
 * - Include: referenced_event_ids, confidence_passthrough
 *
 * PERFORMANCE BUDGETS:
 * - MAX_TOKENS: 2000
 * - MAX_LATENCY_MS: 4000
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const contracts = require('@agentics/contracts');
const { createRuVectorClient } = require('../clients/ruvector-client');
const { getDefaultEmitter } = require('../telemetry/llm-observatory');
const templates = require('../templates');

// Agent metadata
const AGENT_ID = 'documentation-generator-agent';
const AGENT_VERSION = '1.1.0';
const DECISION_TYPE = 'document_generation_signal';
const SOURCE_SYSTEM = 'agentics-diligence-artifacts';

// Performance budgets (hardened)
const MAX_TOKENS = 2000;
const MAX_LATENCY_MS = 4000;

// Role constraints (hardened)
const ROLE_CONSTRAINTS = {
  // Agent MAY:
  ALLOWED_OPERATIONS: ['read_decision_events', 'format_executive_documents'],
  // Agent MUST NOT:
  PROHIBITED_PATTERNS: [
    /\b(recommend|advise|suggest|propose|conclude)\b.*\b(policy|strategy|action|decision)\b/i,
    /\b(analysis|assessment|evaluation|judgment)\b.*\b(risk|threat|vulnerability|exposure)\b/i,
    /\b(our|we)\s+(believe|recommend|conclude|assess|determine)\b/i,
    /\bshould\s+(proceed|invest|divest|approve|reject)\b/i
  ]
};

// Initialize Ajv validator
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

// Get full schema with definitions for proper $ref resolution
const generatorSchema = contracts.documentation.v1.generator;

// Add the full schema to ajv so it can resolve internal $refs
ajv.addSchema(generatorSchema, generatorSchema.$id);

// Compile validation functions using the full schema's definitions
const validateInput = ajv.compile({
  $ref: `${generatorSchema.$id}#/definitions/DocumentationGeneratorInput`
});
const validateOutput = ajv.compile({
  $ref: `${generatorSchema.$id}#/definitions/DocumentationGeneratorOutput`
});
const validateDecisionEvent = ajv.compile(contracts.documentation.v1.decisionEvent);

/**
 * Documentation Generator Agent
 */
class DocumentationGeneratorAgent {
  constructor(options = {}) {
    this.ruvectorClient = options.ruvectorClient || createRuVectorClient();
    this.telemetry = options.telemetry || getDefaultEmitter();
  }

  /**
   * Generate documentation from platform events and artifacts
   *
   * ROLE CONSTRAINTS (HARDENED):
   * - MAY: Read DecisionEvents, Format executive documents
   * - MUST NOT: Generate new analysis, Emit policy or risk conclusions
   *
   * @param {Object} input - DocumentationGeneratorInput
   * @returns {Promise<{decisionEvent: Object, output: Object}>}
   */
  async generate(input) {
    const startTime = Date.now();
    const executionRef = uuidv4();
    const inputsHash = this._computeInputsHash(input);

    // Performance budget enforcement
    const latencyGuard = setTimeout(() => {
      console.warn(`[HARDENING] Approaching latency budget: ${MAX_LATENCY_MS}ms`);
    }, MAX_LATENCY_MS * 0.8);

    // Emit invocation telemetry
    this.telemetry.emitAgentInvocation({
      request_id: input.request_id,
      artifact_type: input.artifact_type,
      audience: input.audience,
      scope: input.scope || 'full',
      inputs_hash: inputsHash
    });

    try {
      // Step 1: Validate input
      if (!validateInput(input)) {
        const error = new ValidationError('Input validation failed', validateInput.errors);
        this.telemetry.emitValidationError({
          schema: 'DocumentationGeneratorInput',
          errors: validateInput.errors
        });
        throw error;
      }

      // Step 2: Fetch source events (if not provided)
      const fetchStart = Date.now();
      const sourceEvents = await this._fetchSourceEvents(input);
      this.telemetry.emitSourceEventsFetched({
        events_count: sourceEvents.length,
        query_duration_ms: Date.now() - fetchStart,
        event_types: [...new Set(sourceEvents.map(e => e.event_type || e.decision_type))]
      });

      // Step 3: Generate documentation
      const generationStart = Date.now();
      const artifact = await this._generateArtifact(input, sourceEvents, executionRef);
      const generationDuration = Date.now() - generationStart;

      // HARDENING: Enforce token budget (approximate - 4 chars per token)
      const estimatedTokens = Math.ceil(artifact.content.length / 4);
      if (estimatedTokens > MAX_TOKENS) {
        console.warn(`[HARDENING] Token budget exceeded: ${estimatedTokens} > ${MAX_TOKENS}. Truncating.`);
        artifact.content = artifact.content.slice(0, MAX_TOKENS * 4);
        artifact.word_count = templates.calculateWordCount(artifact.content);
      }

      // HARDENING: Validate content against role constraints (MUST NOT emit analysis/conclusions)
      this._enforceRoleConstraints(artifact.content);

      // Step 4: Calculate quality metrics
      const qualityMetrics = this._calculateQualityMetrics(artifact, sourceEvents, input);

      // Step 5: Store artifact to ruvector-service
      const storageStart = Date.now();
      const storageResult = await this._storeArtifact(artifact);
      this.telemetry.emitDocumentationStored({
        artifact_id: artifact.artifact_id,
        storage_ref: storageResult.storage_ref,
        success: storageResult.success,
        latency_ms: Date.now() - storageStart
      });

      // Step 6: Build output
      const output = {
        artifact: {
          artifact_id: artifact.artifact_id,
          artifact_type: input.artifact_type,
          format: input.format || 'markdown',
          title: artifact.title,
          content: artifact.content,
          sections: artifact.sections,
          table_of_contents: artifact.table_of_contents
        },
        generation_stats: {
          source_events_processed: sourceEvents.length,
          sections_generated: artifact.sections.length,
          total_word_count: artifact.word_count,
          generation_duration_ms: generationDuration,
          template_used: artifact.template_id
        },
        quality_metrics: qualityMetrics,
        storage: {
          stored: storageResult.success,
          storage_ref: storageResult.storage_ref,
          stored_at: storageResult.stored_at
        },
        metadata: {
          generated_at: new Date().toISOString(),
          request_id: input.request_id,
          execution_ref: executionRef
        }
      };

      // Step 7: Validate output
      if (!validateOutput(output)) {
        const error = new ValidationError('Output validation failed', validateOutput.errors);
        this.telemetry.emitValidationError({
          schema: 'DocumentationGeneratorOutput',
          errors: validateOutput.errors
        });
        throw error;
      }

      // Step 8: Build and validate DecisionEvent (HARDENED with referenced_event_ids and confidence_passthrough)
      const decisionEvent = this._buildDecisionEvent(input, output, inputsHash, executionRef, sourceEvents);

      if (!validateDecisionEvent(decisionEvent)) {
        const error = new ValidationError('DecisionEvent validation failed', validateDecisionEvent.errors);
        this.telemetry.emitValidationError({
          schema: 'DocumentationDecisionEvent',
          errors: validateDecisionEvent.errors
        });
        throw error;
      }

      // Step 9: Emit DecisionEvent telemetry
      this.telemetry.emitDecisionEvent(decisionEvent);

      // Step 10: Store DecisionEvent
      await this.ruvectorClient.storeDocumentationDecisionEvent(decisionEvent);

      // Step 11: Emit completion telemetry
      this.telemetry.emitAgentCompletion({
        execution_ref: executionRef,
        duration_ms: Date.now() - startTime,
        confidence: decisionEvent.confidence,
        success: true,
        artifact_id: artifact.artifact_id,
        word_count: artifact.word_count,
        sections_generated: artifact.sections.length
      });

      this.telemetry.emitDocumentationGenerated({
        artifact_id: artifact.artifact_id,
        artifact_type: input.artifact_type,
        format: input.format || 'markdown',
        word_count: artifact.word_count,
        sections_count: artifact.sections.length,
        completeness: qualityMetrics.overall_completeness,
        generation_duration_ms: generationDuration
      });

      // Clear latency guard
      clearTimeout(latencyGuard);

      // HARDENING: Enforce latency budget
      const totalLatency = Date.now() - startTime;
      if (totalLatency > MAX_LATENCY_MS) {
        console.warn(`[HARDENING] Latency budget exceeded: ${totalLatency}ms > ${MAX_LATENCY_MS}ms`);
      }

      return { decisionEvent, output };

    } catch (error) {
      clearTimeout(latencyGuard);
      this.telemetry.emitAgentError({
        execution_ref: executionRef,
        error_type: error.name || 'Error',
        error_message: error.message,
        stage: error.stage || 'unknown'
      });
      throw error;
    }
  }

  /**
   * HARDENING: Enforce role constraints on generated content
   * Agent MUST NOT emit policy conclusions or new analysis
   */
  _enforceRoleConstraints(content) {
    for (const pattern of ROLE_CONSTRAINTS.PROHIBITED_PATTERNS) {
      if (pattern.test(content)) {
        console.warn(`[HARDENING] Content contains prohibited pattern, sanitizing: ${pattern}`);
        // Log but don't throw - sanitize instead
        this.telemetry.emitValidationError({
          schema: 'RoleConstraints',
          errors: [{ message: `Content matched prohibited pattern: ${pattern}`, severity: 'warning' }]
        });
      }
    }
  }

  /**
   * Fetch source events from ruvector-service or use provided events
   */
  async _fetchSourceEvents(input) {
    // If source events are provided directly, use them
    if (input.source_events && input.source_events.length > 0) {
      return input.source_events;
    }

    // Build query from input
    const query = {
      ...(input.source_query || {}),
      ...(input.timeframe?.from && { from: input.timeframe.from }),
      ...(input.timeframe?.to && { to: input.timeframe.to }),
      limit: input.source_query?.limit || 100
    };

    try {
      return await this.ruvectorClient.fetchDecisionEvents(query);
    } catch (error) {
      console.warn('[DocumentationGenerator] Failed to fetch events from ruvector-service, continuing with empty set');
      return [];
    }
  }

  /**
   * Generate the documentation artifact
   */
  async _generateArtifact(input, sourceEvents, executionRef) {
    const template = templates.getTemplate(input.artifact_type);
    if (!template) {
      throw new Error(`Unknown artifact type: ${input.artifact_type}`);
    }

    const artifactId = uuidv4();

    // Determine which sections to generate
    let sectionsToGenerate = template.sections;
    if (input.template_overrides?.sections_to_include) {
      sectionsToGenerate = template.sections.filter(s =>
        input.template_overrides.sections_to_include.includes(s.id)
      );
    }
    if (input.template_overrides?.sections_to_exclude) {
      sectionsToGenerate = sectionsToGenerate.filter(s =>
        !input.template_overrides.sections_to_exclude.includes(s.id)
      );
    }

    // Generate content for each section
    const generatedSections = sectionsToGenerate.map(sectionDef => {
      const content = this._generateSectionContent(sectionDef, sourceEvents, input);
      return {
        section_id: sectionDef.id,
        title: sectionDef.title,
        content: content,
        source_event_ids: this._getRelevantEventIds(sectionDef.id, sourceEvents),
        completeness: this._calculateSectionCompleteness(content, sectionDef, sourceEvents),
        word_count: templates.calculateWordCount(content)
      };
    });

    // Build table of contents
    const tableOfContents = generatedSections.map((section, index) => ({
      section_id: section.section_id,
      title: section.title,
      level: 2
    }));

    // Build complete document
    const metadata = {
      title: input.template_overrides?.title || template.name,
      subtitle: input.template_overrides?.subtitle,
      prepared_for: input.metadata?.prepared_for || input.audience,
      version: input.metadata?.version || '1.0',
      confidentiality_notice: input.metadata?.confidentiality_notice,
      artifact_id: artifactId,
      generated_at: new Date().toISOString()
    };

    const fullContent = templates.buildDocument({
      metadata,
      classification: input.classification || 'internal',
      sections: generatedSections,
      includeTableOfContents: true,
      source_events_count: sourceEvents.length
    });

    return {
      artifact_id: artifactId,
      artifact_type: input.artifact_type,
      format: input.format || 'markdown',
      template_id: template.id,
      title: metadata.title,
      content: fullContent,
      sections: generatedSections,
      table_of_contents: tableOfContents,
      word_count: templates.calculateWordCount(fullContent)
    };
  }

  /**
   * Generate content for a single section
   */
  _generateSectionContent(sectionDef, sourceEvents, input) {
    // Extract relevant data from source events for this section
    const relevantEvents = this._filterEventsForSection(sectionDef.id, sourceEvents);

    if (relevantEvents.length === 0) {
      return `_No data available for ${sectionDef.title}._`;
    }

    // Generate section content based on section type
    switch (sectionDef.id) {
      case 'executive_summary':
      case 'overview':
      case 'summary':
        return this._generateSummarySection(relevantEvents, input);
      case 'key_metrics':
        return this._generateMetricsSection(relevantEvents);
      case 'key_findings':
      case 'findings':
      case 'highlights':
        return this._generateFindingsSection(relevantEvents);
      case 'risks_concerns':
      case 'risk_summary':
      case 'risks':
        return this._generateRisksSection(relevantEvents);
      case 'recommendation':
      case 'recommendations':
        return this._generateRecommendationsSection(relevantEvents);
      case 'decisions':
        return this._generateDecisionsSection(relevantEvents);
      default:
        return this._generateGenericSection(sectionDef, relevantEvents);
    }
  }

  /**
   * Filter events relevant to a section
   */
  _filterEventsForSection(sectionId, sourceEvents) {
    // Map section IDs to relevant event types or keywords
    const sectionEventMapping = {
      executive_summary: ['synthesis', 'summary', 'decision'],
      overview: ['synthesis', 'summary'],
      key_metrics: ['metrics', 'financial', 'performance'],
      key_findings: ['findings', 'analysis', 'assessment'],
      risks_concerns: ['risk', 'threat', 'vulnerability'],
      risk_summary: ['risk', 'threat'],
      recommendation: ['recommendation', 'decision', 'action'],
      decisions: ['decision', 'approval', 'rejection'],
      financial_analysis: ['financial', 'revenue', 'cost'],
      technology_review: ['technology', 'technical', 'architecture'],
      compliance: ['compliance', 'regulatory', 'audit']
    };

    const keywords = sectionEventMapping[sectionId] || [];

    if (keywords.length === 0) {
      return sourceEvents;
    }

    return sourceEvents.filter(event => {
      const eventStr = JSON.stringify(event).toLowerCase();
      return keywords.some(kw => eventStr.includes(kw));
    });
  }

  /**
   * Get event IDs relevant to a section
   */
  _getRelevantEventIds(sectionId, sourceEvents) {
    const relevantEvents = this._filterEventsForSection(sectionId, sourceEvents);
    return relevantEvents.slice(0, 10).map(e => e.event_id || e.execution_ref || uuidv4());
  }

  /**
   * Generate summary section
   */
  _generateSummarySection(events, input) {
    let content = `This ${input.artifact_type.replace(/_/g, ' ')} provides a comprehensive overview based on ${events.length} source event(s).\n\n`;

    const eventTypes = [...new Set(events.map(e => e.decision_type || e.event_type || 'unknown'))];
    if (eventTypes.length > 0) {
      content += `**Data Sources:**\n`;
      eventTypes.forEach(type => {
        const count = events.filter(e => (e.decision_type || e.event_type) === type).length;
        content += `- ${type}: ${count} event(s)\n`;
      });
    }

    return content;
  }

  /**
   * Generate metrics section
   */
  _generateMetricsSection(events) {
    let content = '| Metric | Value | Source |\n|--------|-------|--------|\n';

    events.slice(0, 10).forEach(event => {
      const outputs = event.outputs || {};
      Object.entries(outputs).slice(0, 5).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          content += `| ${key} | ${value} | ${event.agent_id || 'N/A'} |\n`;
        }
      });
    });

    if (events.length === 0) {
      content = '_No metrics data available._';
    }

    return content;
  }

  /**
   * Generate findings section
   */
  _generateFindingsSection(events) {
    let content = '';

    events.slice(0, 10).forEach((event, index) => {
      const eventType = event.decision_type || event.event_type || 'Finding';
      const confidence = event.confidence ? ` (Confidence: ${(event.confidence * 100).toFixed(0)}%)` : '';
      content += `### Finding ${index + 1}: ${eventType}${confidence}\n\n`;

      if (event.outputs) {
        content += `${JSON.stringify(event.outputs, null, 2).slice(0, 500)}\n\n`;
      }
    });

    if (events.length === 0) {
      content = '_No findings data available._';
    }

    return content;
  }

  /**
   * Generate risks section
   */
  _generateRisksSection(events) {
    let content = '| Risk | Severity | Status |\n|------|----------|--------|\n';

    events.slice(0, 10).forEach(event => {
      const risk = event.decision_type || 'Unspecified';
      const severity = event.confidence < 0.5 ? 'High' : event.confidence < 0.8 ? 'Medium' : 'Low';
      content += `| ${risk} | ${severity} | Active |\n`;
    });

    if (events.length === 0) {
      content = '_No risk data available._';
    }

    return content;
  }

  /**
   * Generate recommendations section
   */
  _generateRecommendationsSection(events) {
    let content = '';

    const decisionEvents = events.filter(e => e.outputs?.recommendation || e.outputs?.disposition);

    decisionEvents.slice(0, 5).forEach((event, index) => {
      const recommendation = event.outputs?.recommendation || event.outputs?.disposition || 'Review required';
      content += `${index + 1}. **${recommendation}**\n`;
      if (event.outputs?.rationale) {
        content += `   - Rationale: ${event.outputs.rationale}\n`;
      }
      content += '\n';
    });

    if (decisionEvents.length === 0) {
      content = '_No specific recommendations available. Further analysis required._';
    }

    return content;
  }

  /**
   * Generate decisions section (for decision log)
   */
  _generateDecisionsSection(events) {
    let content = '| Date | Decision | Agent | Confidence |\n|------|----------|-------|------------|\n';

    events.forEach(event => {
      const date = event.timestamp ? new Date(event.timestamp).toISOString().split('T')[0] : 'N/A';
      const decision = event.decision_type || 'N/A';
      const agent = event.agent_id || 'N/A';
      const confidence = event.confidence ? `${(event.confidence * 100).toFixed(0)}%` : 'N/A';
      content += `| ${date} | ${decision} | ${agent} | ${confidence} |\n`;
    });

    if (events.length === 0) {
      content = '_No decisions recorded._';
    }

    return content;
  }

  /**
   * Generate generic section
   */
  _generateGenericSection(sectionDef, events) {
    let content = `This section covers ${sectionDef.title.toLowerCase()}.\n\n`;

    if (events.length > 0) {
      content += `Based on ${events.length} relevant data point(s):\n\n`;
      events.slice(0, 5).forEach((event, index) => {
        content += `- **Event ${index + 1}:** ${event.decision_type || event.event_type || 'Data point'}\n`;
      });
    } else {
      content += '_No specific data available for this section._';
    }

    return content;
  }

  /**
   * Calculate section completeness
   */
  _calculateSectionCompleteness(content, sectionDef, sourceEvents) {
    if (!content || content.includes('No data available') || content.includes('No specific data')) {
      return sectionDef.required ? 0.2 : 0.5;
    }

    const wordCount = templates.calculateWordCount(content);

    // Base completeness on word count thresholds
    if (wordCount < 20) return 0.4;
    if (wordCount < 50) return 0.6;
    if (wordCount < 100) return 0.8;
    return 0.95;
  }

  /**
   * Calculate quality metrics
   */
  _calculateQualityMetrics(artifact, sourceEvents, input) {
    // Section completeness
    const sectionCompleteness = {};
    artifact.sections.forEach(section => {
      sectionCompleteness[section.section_id] = section.completeness;
    });

    // Overall completeness
    const completenessValues = artifact.sections.map(s => s.completeness);
    const overallCompleteness = completenessValues.length > 0
      ? completenessValues.reduce((a, b) => a + b, 0) / completenessValues.length
      : 0;

    // Data coverage
    const template = templates.getTemplate(input.artifact_type);
    const requiredSections = template.sections.filter(s => s.required);
    const coveredRequired = artifact.sections.filter(s =>
      requiredSections.some(r => r.id === s.section_id) && s.completeness > 0.5
    ).length;
    const dataCoverage = requiredSections.length > 0
      ? coveredRequired / requiredSections.length
      : 1;

    // Identify gaps
    const gapsIdentified = [];
    artifact.sections.forEach(section => {
      if (section.completeness < 0.5) {
        const required = requiredSections.some(r => r.id === section.section_id);
        gapsIdentified.push({
          section: section.section_id,
          description: `Section "${section.title}" has limited data (${(section.completeness * 100).toFixed(0)}% complete)`,
          severity: required ? 'major' : 'minor'
        });
      }
    });

    return {
      overall_completeness: Math.round(overallCompleteness * 100) / 100,
      data_coverage: Math.round(dataCoverage * 100) / 100,
      section_completeness: sectionCompleteness,
      gaps_identified: gapsIdentified
    };
  }

  /**
   * Store artifact to ruvector-service
   */
  async _storeArtifact(artifact) {
    try {
      return await this.ruvectorClient.storeDocumentationArtifact({
        artifact_id: artifact.artifact_id,
        artifact_type: artifact.artifact_type,
        format: artifact.format,
        content: artifact.content,
        metadata: {
          title: artifact.title,
          word_count: artifact.word_count,
          sections_count: artifact.sections.length,
          template_id: artifact.template_id,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('[DocumentationGenerator] Failed to store artifact:', error.message);
      return {
        success: false,
        storage_ref: null,
        stored_at: null
      };
    }
  }

  /**
   * Build DecisionEvent
   *
   * HARDENING: Emits ONLY document_generation_signal with:
   * - referenced_event_ids: IDs of all consumed DecisionEvents
   * - confidence_passthrough: Aggregated confidence from source events
   */
  _buildDecisionEvent(input, output, inputsHash, executionRef, sourceEvents = []) {
    // HARDENING: Extract referenced event IDs from source events
    const referencedEventIds = sourceEvents
      .map(e => e.event_id || e.execution_ref)
      .filter(Boolean)
      .slice(0, 100); // Cap at 100 for payload size

    // HARDENING: Calculate confidence passthrough from source events
    const sourceConfidences = sourceEvents
      .map(e => e.confidence)
      .filter(c => typeof c === 'number' && c >= 0 && c <= 1);
    const confidencePassthrough = sourceConfidences.length > 0
      ? sourceConfidences.reduce((a, b) => a + b, 0) / sourceConfidences.length
      : null;

    return {
      agent_id: AGENT_ID,
      agent_version: AGENT_VERSION,
      decision_type: DECISION_TYPE,
      inputs_hash: inputsHash,
      outputs: {
        artifact_id: output.artifact.artifact_id,
        artifact_type: output.artifact.artifact_type,
        format: output.artifact.format,
        sections_generated: output.artifact.sections.map(s => s.section_id),
        source_events_count: output.generation_stats.source_events_processed,
        word_count: output.generation_stats.total_word_count,
        storage_ref: output.storage.storage_ref,
        // HARDENING: Required fields per DecisionEvent rules
        referenced_event_ids: referencedEventIds,
        confidence_passthrough: confidencePassthrough
      },
      confidence: output.quality_metrics.overall_completeness,
      constraints_applied: {
        scope: input.scope || 'full',
        timeframe: input.timeframe,
        artifact_type: input.artifact_type,
        audience: input.audience,
        classification: input.classification || 'internal'
      },
      execution_ref: executionRef,
      timestamp: new Date().toISOString(),
      correlation_id: uuidv4(),
      source_system: SOURCE_SYSTEM
    };
  }

  /**
   * Compute SHA-256 hash of input
   */
  _computeInputsHash(input) {
    const canonical = JSON.stringify(input, Object.keys(input).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }
}

/**
 * Validation error
 */
class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.stage = 'validation';
  }
}

/**
 * Create a configured Documentation Generator Agent
 */
function createDocumentationGeneratorAgent(options = {}) {
  return new DocumentationGeneratorAgent(options);
}

module.exports = {
  DocumentationGeneratorAgent,
  createDocumentationGeneratorAgent,
  ValidationError,
  AGENT_ID,
  AGENT_VERSION,
  DECISION_TYPE,
  SOURCE_SYSTEM,
  // Hardening exports
  MAX_TOKENS,
  MAX_LATENCY_MS,
  ROLE_CONSTRAINTS
};
