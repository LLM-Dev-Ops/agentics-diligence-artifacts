/**
 * RuVector Service Client for Documentation Generator Agent
 *
 * Client for reading DecisionEvents and writing documentation artifacts.
 *
 * CRITICAL CONSTRAINTS (from Constitution):
 * - This client NEVER connects directly to Google SQL
 * - This client NEVER executes SQL
 * - ALL reads/writes are via ruvector-service API calls
 * - Documentation artifacts are written to ruvector-service only
 */

const RUVECTOR_SERVICE_URL = process.env.RUVECTOR_SERVICE_URL || 'http://localhost:8080';

/**
 * RuVector client for documentation artifact operations
 */
class RuVectorClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || RUVECTOR_SERVICE_URL;
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
  }

  // ===========================================================================
  // READ OPERATIONS (DecisionEvents and Artifacts)
  // ===========================================================================

  /**
   * Fetch DecisionEvents from ruvector-service
   *
   * @param {Object} query - Query parameters
   * @param {string[]} query.event_types - Filter by event types
   * @param {string[]} query.agent_ids - Filter by agent IDs
   * @param {string} query.from - Start timestamp (ISO 8601)
   * @param {string} query.to - End timestamp (ISO 8601)
   * @param {number} query.limit - Maximum results
   * @returns {Promise<Object[]>} - Array of DecisionEvents
   */
  async fetchDecisionEvents(query = {}) {
    const params = new URLSearchParams();
    if (query.event_types) params.append('event_types', query.event_types.join(','));
    if (query.agent_ids) params.append('agent_ids', query.agent_ids.join(','));
    if (query.from) params.append('from', query.from);
    if (query.to) params.append('to', query.to);
    if (query.limit) params.append('limit', String(query.limit));

    const endpoint = `${this.baseUrl}/v1/events?${params.toString()}`;

    try {
      const response = await this._fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`RuVector API error: ${response.status}`);
      }

      const result = await response.json();
      return result.events || [];
    } catch (error) {
      console.error(`[RuVectorClient] Failed to fetch DecisionEvents:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch a specific DecisionEvent by ID
   *
   * @param {string} eventId - Event ID
   * @returns {Promise<Object|null>}
   */
  async fetchDecisionEventById(eventId) {
    const endpoint = `${this.baseUrl}/v1/events/${encodeURIComponent(eventId)}`;

    try {
      const response = await this._fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`RuVector API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[RuVectorClient] Failed to fetch event ${eventId}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch platform artifacts (synthesis results, etc.)
   *
   * @param {Object} query - Query parameters
   * @returns {Promise<Object[]>}
   */
  async fetchPlatformArtifacts(query = {}) {
    const params = new URLSearchParams();
    if (query.artifact_types) params.append('types', query.artifact_types.join(','));
    if (query.from) params.append('from', query.from);
    if (query.to) params.append('to', query.to);
    if (query.limit) params.append('limit', String(query.limit));

    const endpoint = `${this.baseUrl}/v1/artifacts?${params.toString()}`;

    try {
      const response = await this._fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`RuVector API error: ${response.status}`);
      }

      const result = await response.json();
      return result.artifacts || [];
    } catch (error) {
      console.error(`[RuVectorClient] Failed to fetch artifacts:`, error.message);
      throw error;
    }
  }

  // ===========================================================================
  // WRITE OPERATIONS (Documentation Artifacts)
  // ===========================================================================

  /**
   * Store a generated documentation artifact
   *
   * @param {Object} artifact - Documentation artifact
   * @param {string} artifact.artifact_id - Unique ID
   * @param {string} artifact.artifact_type - Type of documentation
   * @param {string} artifact.format - Output format
   * @param {string} artifact.content - Document content
   * @param {Object} artifact.metadata - Additional metadata
   * @returns {Promise<{success: boolean, storage_ref: string, stored_at: string}>}
   */
  async storeDocumentationArtifact(artifact) {
    const endpoint = `${this.baseUrl}/v1/artifacts/documentation`;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this._fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Agent-Id': 'documentation-generator-agent'
          },
          body: JSON.stringify(artifact)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`RuVector API error: ${response.status} - ${errorBody}`);
        }

        const result = await response.json();
        return {
          success: true,
          storage_ref: result.storage_ref || artifact.artifact_id,
          stored_at: result.stored_at || new Date().toISOString()
        };
      } catch (error) {
        if (attempt === this.retryAttempts) {
          console.error(`[RuVectorClient] Failed after ${this.retryAttempts} attempts:`, error.message);
          throw error;
        }
        console.warn(`[RuVectorClient] Attempt ${attempt} failed, retrying...`);
        await this._delay(this.retryDelayMs * attempt);
      }
    }
  }

  /**
   * Store a documentation DecisionEvent
   *
   * @param {Object} decisionEvent - The DecisionEvent to persist
   * @returns {Promise<{success: boolean, event_id: string, stored_at: string}>}
   */
  async storeDocumentationDecisionEvent(decisionEvent) {
    const endpoint = `${this.baseUrl}/v1/events/documentation`;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this._fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Agent-Id': decisionEvent.agent_id,
            'X-Agent-Version': decisionEvent.agent_version
          },
          body: JSON.stringify(decisionEvent)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`RuVector API error: ${response.status} - ${errorBody}`);
        }

        const result = await response.json();
        return {
          success: true,
          event_id: result.event_id || decisionEvent.execution_ref,
          stored_at: result.stored_at || new Date().toISOString()
        };
      } catch (error) {
        if (attempt === this.retryAttempts) {
          console.error(`[RuVectorClient] Failed after ${this.retryAttempts} attempts:`, error.message);
          throw error;
        }
        await this._delay(this.retryDelayMs * attempt);
      }
    }
  }

  /**
   * Retrieve a stored documentation artifact
   *
   * @param {string} artifactId - Artifact ID
   * @returns {Promise<Object|null>}
   */
  async retrieveDocumentationArtifact(artifactId) {
    const endpoint = `${this.baseUrl}/v1/artifacts/documentation/${encodeURIComponent(artifactId)}`;

    try {
      const response = await this._fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`RuVector API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[RuVectorClient] Failed to retrieve artifact ${artifactId}:`, error.message);
      throw error;
    }
  }

  /**
   * List documentation artifacts
   *
   * @param {Object} query - Query parameters
   * @returns {Promise<Object[]>}
   */
  async listDocumentationArtifacts(query = {}) {
    const params = new URLSearchParams();
    if (query.artifact_type) params.append('type', query.artifact_type);
    if (query.from) params.append('from', query.from);
    if (query.to) params.append('to', query.to);
    if (query.limit) params.append('limit', String(query.limit || 50));

    const endpoint = `${this.baseUrl}/v1/artifacts/documentation?${params.toString()}`;

    try {
      const response = await this._fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`RuVector API error: ${response.status}`);
      }

      const result = await response.json();
      return result.artifacts || [];
    } catch (error) {
      console.error(`[RuVectorClient] Failed to list documentation artifacts:`, error.message);
      throw error;
    }
  }

  // ===========================================================================
  // HEALTH & UTILITY
  // ===========================================================================

  /**
   * Health check
   */
  async healthCheck() {
    const start = Date.now();
    try {
      const response = await this._fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      return {
        healthy: response.ok,
        latency_ms: Date.now() - start
      };
    } catch (error) {
      return {
        healthy: false,
        latency_ms: Date.now() - start,
        error: error.message
      };
    }
  }

  /**
   * Internal fetch with timeout
   */
  async _fetch(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Internal delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a configured RuVector client
 */
function createRuVectorClient(options = {}) {
  return new RuVectorClient(options);
}

module.exports = {
  RuVectorClient,
  createRuVectorClient
};
