/**
 * src/api/client.js — API Client
 * Replaces Base44 SDK with standard fetch() calls to our REST API
 */

/**
 * Core fetch wrapper with credentials and error handling
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err.message || 'API Error');
    error.status = res.status;
    error.data = err;
    throw error;
  }

  // Handle empty responses (204, DELETE, etc.)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

/**
 * GET request with optional query parameters
 * @param {string} path - API endpoint path
 * @param {object} params - Query parameters (undefined/null values are filtered out)
 */
export const apiGet = (path, params = {}) => {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const qs = filtered.length ? '?' + new URLSearchParams(filtered).toString() : '';
  return apiFetch(`${path}${qs}`);
};

/**
 * POST request with JSON body
 */
export const apiPost = (path, body) =>
  apiFetch(path, { method: 'POST', body: JSON.stringify(body) });

/**
 * PUT request with JSON body
 */
export const apiPut = (path, body) =>
  apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });

/**
 * DELETE request
 */
export const apiDelete = (path) =>
  apiFetch(path, { method: 'DELETE' });

/**
 * AI LLM invocation shorthand
 * @param {string} prompt - The prompt to send
 * @param {object} response_json_schema - Expected JSON schema
 * @param {string} [model] - Optional model override
 */
export const apiAI = (prompt, response_json_schema, model) =>
  apiPost('/api/ai/invoke-llm', { prompt, response_json_schema, model });

/**
 * Get admin headers (X-Admin-Code) from session storage
 * Used automatically by the AdminGate component
 */
export const getAdminHeaders = () => ({
  'X-Admin-Code': sessionStorage.getItem('chronicle_admin_code') || '',
});

export default { apiGet, apiPost, apiPut, apiDelete, apiAI, getAdminHeaders };
