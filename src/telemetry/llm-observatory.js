/**
 * LLM Observatory Telemetry Emitter for Documentation Generator Agent
 *
 * Emits telemetry compatible with LLM-Observatory for documentation
 * generation tracking and monitoring.
 */

const OBSERVATORY_ENDPOINT = process.env.LLM_OBSERVATORY_URL || 'http://localhost:9090';
const TELEMETRY_ENABLED = process.env.LLM_OBSERVATORY_ENABLED !== 'false';

/**
 * Telemetry event types for documentation generation
 */
const TelemetryEventType = {
  AGENT_INVOCATION: 'agent.invocation',
  AGENT_COMPLETION: 'agent.completion',
  AGENT_ERROR: 'agent.error',
  DOCUMENTATION_GENERATED: 'documentation.generated',
  DOCUMENTATION_STORED: 'documentation.stored',
  DECISION_EVENT_EMITTED: 'decision_event.emitted',
  VALIDATION_ERROR: 'validation.error',
  SOURCE_EVENTS_FETCHED: 'source_events.fetched'
};

/**
 * LLM Observatory telemetry emitter
 */
class LLMObservatoryTelemetry {
  constructor(options = {}) {
    this.endpoint = options.endpoint || OBSERVATORY_ENDPOINT;
    this.enabled = options.enabled ?? TELEMETRY_ENABLED;
    this.serviceName = 'agentics-diligence-artifacts';
    this.agentId = 'documentation-generator-agent';
    this.batchSize = options.batchSize || 10;
    this.flushIntervalMs = options.flushIntervalMs || 5000;
    this._buffer = [];
    this._flushTimer = null;

    if (this.enabled) {
      this._startFlushTimer();
    }
  }

  /**
   * Emit agent invocation telemetry
   */
  emitAgentInvocation(data) {
    this._emit({
      type: TelemetryEventType.AGENT_INVOCATION,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: this.agentId,
        request_id: data.request_id,
        artifact_type: data.artifact_type,
        audience: data.audience,
        scope: data.scope,
        inputs_hash: data.inputs_hash
      }
    });
  }

  /**
   * Emit agent completion telemetry
   */
  emitAgentCompletion(data) {
    this._emit({
      type: TelemetryEventType.AGENT_COMPLETION,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: this.agentId,
        execution_ref: data.execution_ref,
        duration_ms: data.duration_ms,
        confidence: data.confidence,
        success: data.success,
        artifact_id: data.artifact_id,
        word_count: data.word_count,
        sections_generated: data.sections_generated
      }
    });
  }

  /**
   * Emit agent error telemetry
   */
  emitAgentError(data) {
    this._emit({
      type: TelemetryEventType.AGENT_ERROR,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: this.agentId,
        execution_ref: data.execution_ref,
        error_type: data.error_type,
        error_message: data.error_message,
        stage: data.stage
      }
    });
  }

  /**
   * Emit documentation generated telemetry
   */
  emitDocumentationGenerated(data) {
    this._emit({
      type: TelemetryEventType.DOCUMENTATION_GENERATED,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: this.agentId,
        artifact_id: data.artifact_id,
        artifact_type: data.artifact_type,
        format: data.format,
        word_count: data.word_count,
        sections_count: data.sections_count,
        completeness: data.completeness,
        generation_duration_ms: data.generation_duration_ms
      }
    });
  }

  /**
   * Emit documentation stored telemetry
   */
  emitDocumentationStored(data) {
    this._emit({
      type: TelemetryEventType.DOCUMENTATION_STORED,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: this.agentId,
        artifact_id: data.artifact_id,
        storage_ref: data.storage_ref,
        success: data.success,
        latency_ms: data.latency_ms
      }
    });
  }

  /**
   * Emit DecisionEvent emitted telemetry
   */
  emitDecisionEvent(decisionEvent) {
    this._emit({
      type: TelemetryEventType.DECISION_EVENT_EMITTED,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: decisionEvent.agent_id,
        agent_version: decisionEvent.agent_version,
        decision_type: decisionEvent.decision_type,
        execution_ref: decisionEvent.execution_ref,
        confidence: decisionEvent.confidence,
        artifact_type: decisionEvent.outputs.artifact_type
      }
    });
  }

  /**
   * Emit source events fetched telemetry
   */
  emitSourceEventsFetched(data) {
    this._emit({
      type: TelemetryEventType.SOURCE_EVENTS_FETCHED,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: this.agentId,
        events_count: data.events_count,
        query_duration_ms: data.query_duration_ms,
        event_types: data.event_types
      }
    });
  }

  /**
   * Emit validation error telemetry
   */
  emitValidationError(data) {
    this._emit({
      type: TelemetryEventType.VALIDATION_ERROR,
      timestamp: new Date().toISOString(),
      data: {
        agent_id: this.agentId,
        schema: data.schema,
        errors: data.errors
      }
    });
  }

  /**
   * Flush buffered telemetry
   */
  async flush() {
    if (this._buffer.length === 0) return;

    const events = [...this._buffer];
    this._buffer = [];

    if (!this.enabled) {
      console.log('[Telemetry] Events (disabled):', JSON.stringify(events, null, 2));
      return;
    }

    try {
      await fetch(`${this.endpoint}/v1/telemetry/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': this.serviceName,
          'X-Agent-Id': this.agentId
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('[Telemetry] Failed to send:', error.message);
      if (this._buffer.length < 1000) {
        this._buffer.push(...events);
      }
    }
  }

  /**
   * Shutdown telemetry
   */
  async shutdown() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    await this.flush();
  }

  _emit(event) {
    this._buffer.push({
      ...event,
      service: this.serviceName,
      agent: this.agentId
    });

    if (this._buffer.length >= this.batchSize) {
      this.flush().catch(console.error);
    }
  }

  _startFlushTimer() {
    this._flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushIntervalMs);
  }
}

function createTelemetryEmitter(options = {}) {
  return new LLMObservatoryTelemetry(options);
}

let defaultEmitter = null;

function getDefaultEmitter() {
  if (!defaultEmitter) {
    defaultEmitter = createTelemetryEmitter();
  }
  return defaultEmitter;
}

module.exports = {
  LLMObservatoryTelemetry,
  TelemetryEventType,
  createTelemetryEmitter,
  getDefaultEmitter
};
