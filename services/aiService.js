/**
 * services/aiService.js — Multi-provider AI abstraction layer
 *
 * Configuration via environment variables:
 *   AI_PROVIDER = groq | openrouter | openai | gemini
 *   AI_API_KEY  = your API key
 *   AI_MODEL    = model name (optional, defaults per provider)
 */

const DEFAULTS = {
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  openrouter: 'openai/gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
};

function getConfig() {
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || DEFAULTS[provider] || DEFAULTS.groq;
  return { provider, apiKey, model };
}

/**
 * Build the system prompt that enforces JSON output matching the schema
 */
function buildSystemPrompt(schema) {
  return `You are a helpful AI assistant. You MUST respond ONLY with valid JSON that exactly matches this schema. No markdown, no code blocks, no explanation — just raw JSON:\n\n${JSON.stringify(schema, null, 2)}`;
}

/**
 * Call OpenAI-compatible API (used by Groq, OpenAI, OpenRouter)
 */
async function callOpenAICompatible(endpoint, apiKey, model, systemPrompt, userPrompt) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://cognitive-chronicle.vercel.app',
      'X-Title': 'Cognitive Chronicle',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(text);
}

/**
 * Call Google Gemini API
 */
async function callGemini(apiKey, model, systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nUser request:\n${userPrompt}` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
}

/**
 * Main AI invocation function
 * @param {object} options
 * @param {string} options.prompt - The user prompt
 * @param {object} options.response_json_schema - JSON schema for the expected response
 * @param {string} [options.model] - Override model for this call
 * @returns {Promise<object>} Parsed JSON response
 */
export async function invokeLLM({ prompt, response_json_schema, model: overrideModel }) {
  const { provider, apiKey, model: defaultModel } = getConfig();
  const model = overrideModel || defaultModel;

  if (!apiKey) {
    throw new Error('AI_API_KEY environment variable is not set');
  }

  const systemPrompt = buildSystemPrompt(response_json_schema || {});

  switch (provider) {
    case 'groq':
      return callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        apiKey, model, systemPrompt, prompt
      );

    case 'openai':
      return callOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        apiKey, model, systemPrompt, prompt
      );

    case 'openrouter':
      return callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        apiKey, model, systemPrompt, prompt
      );

    case 'gemini':
      return callGemini(apiKey, model, systemPrompt, prompt);

    default:
      throw new Error(`Unknown AI provider: ${provider}. Use groq, openai, openrouter, or gemini.`);
  }
}

export default { invokeLLM };
