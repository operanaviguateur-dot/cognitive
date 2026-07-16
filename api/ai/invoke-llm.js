/**
 * api/ai/invoke-llm.js — POST /api/ai/invoke-llm
 * AI proxy Serverless Function. Proxies LLM requests to the configured provider.
 */
import { invokeLLM } from '../../services/aiService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, response_json_schema, model } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ message: 'prompt is required' });
  }

  try {
    const result = await invokeLLM({ prompt, response_json_schema, model });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[ai/invoke-llm]', err.message);
    return res.status(500).json({ message: 'AI request failed', detail: err.message });
  }
}
