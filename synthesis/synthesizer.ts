/**
 * Synthesizer module for LLM orchestration.
 * Accepts DecisionInput, calls LLM, returns structured sections.
 */

import { DecisionInput, SynthesisResult } from './decision_input';
import { SYNTHESIS_SYSTEM_PROMPT, buildUserPrompt } from './synthesis_prompt';

interface LLMConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Calls an OpenAI/Claude-compatible LLM endpoint.
 */
async function callLLM(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = config.model || 'gpt-4o';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as LLMResponse;
  return data.choices[0]?.message?.content || '';
}

/**
 * Parses LLM response into structured sections.
 */
function parseResponse(raw: string): SynthesisResult['sections'] {
  // Attempt to parse as JSON
  let parsed: Record<string, unknown>;
  try {
    // Handle potential markdown code blocks
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse LLM response as JSON: ${raw.substring(0, 200)}...`);
  }

  // Validate required fields and extract
  const sections: SynthesisResult['sections'] = {
    objective: String(parsed.objective || 'Not specified'),
    evaluated: String(parsed.evaluated || 'Not specified'),
    findings: {
      financial_impact: String(parsed.findings && typeof parsed.findings === 'object'
        ? (parsed.findings as Record<string, unknown>).financial_impact || 'Not assessed'
        : 'Not assessed'),
      risk_exposure: String(parsed.findings && typeof parsed.findings === 'object'
        ? (parsed.findings as Record<string, unknown>).risk_exposure || 'Not assessed'
        : 'Not assessed'),
      system_complexity: String(parsed.findings && typeof parsed.findings === 'object'
        ? (parsed.findings as Record<string, unknown>).system_complexity || 'Not assessed'
        : 'Not assessed'),
    },
    comparative_scenarios: String(parsed.comparative_scenarios || 'No comparison available'),
    recommendation: String(parsed.recommendation || 'Insufficient data for recommendation'),
    confidence_assumptions: String(parsed.confidence_assumptions || 'Not specified'),
  };

  return sections;
}

/**
 * Main synthesis function.
 * Accepts DecisionInput, calls LLM, returns SynthesisResult.
 */
export async function synthesize(input: DecisionInput, config?: LLMConfig): Promise<SynthesisResult> {
  const llmConfig: LLMConfig = config || {
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
  };

  if (!llmConfig.apiKey) {
    throw new Error('No API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(input.objective, input.command, input.raw_output, input.precedent) },
  ];

  const rawResponse = await callLLM(llmConfig, messages);
  const sections = parseResponse(rawResponse);

  return {
    sections,
    raw_response: rawResponse,
  };
}
