"use strict";
/**
 * Synthesizer module for LLM orchestration.
 * Accepts DecisionInput, calls LLM, returns structured sections.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesize = synthesize;
const synthesis_prompt_1 = require("./synthesis_prompt");
/**
 * Calls an OpenAI/Claude-compatible LLM endpoint.
 */
async function callLLM(config, messages) {
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
    const data = (await response.json());
    return data.choices[0]?.message?.content || '';
}
/**
 * Parses LLM response into structured sections.
 */
function parseResponse(raw) {
    // Attempt to parse as JSON
    let parsed;
    try {
        // Handle potential markdown code blocks
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
    }
    catch {
        throw new Error(`Failed to parse LLM response as JSON: ${raw.substring(0, 200)}...`);
    }
    // Validate required fields and extract
    const sections = {
        objective: String(parsed.objective || 'Not specified'),
        evaluated: String(parsed.evaluated || 'Not specified'),
        findings: {
            financial_impact: String(parsed.findings && typeof parsed.findings === 'object'
                ? parsed.findings.financial_impact || 'Not assessed'
                : 'Not assessed'),
            risk_exposure: String(parsed.findings && typeof parsed.findings === 'object'
                ? parsed.findings.risk_exposure || 'Not assessed'
                : 'Not assessed'),
            system_complexity: String(parsed.findings && typeof parsed.findings === 'object'
                ? parsed.findings.system_complexity || 'Not assessed'
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
async function synthesize(input, config) {
    const llmConfig = config || {
        apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
        baseUrl: process.env.LLM_BASE_URL,
        model: process.env.LLM_MODEL,
    };
    if (!llmConfig.apiKey) {
        throw new Error('No API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
    }
    const messages = [
        { role: 'system', content: synthesis_prompt_1.SYNTHESIS_SYSTEM_PROMPT },
        { role: 'user', content: (0, synthesis_prompt_1.buildUserPrompt)(input.objective, input.command, input.raw_output, input.precedent) },
    ];
    const rawResponse = await callLLM(llmConfig, messages);
    const sections = parseResponse(rawResponse);
    return {
        sections,
        raw_response: rawResponse,
    };
}
