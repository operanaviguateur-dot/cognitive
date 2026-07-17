/**
 * src/api/client.js — API Client
 * Replaces Base44 SDK with standard fetch() calls to our REST API
 */

/**
 * Core fetch wrapper with credentials and error handling.
 * Automatically includes X-Admin-Code from sessionStorage when available.
 */
async function apiFetch(path, options = {}) {
  // Auto-include admin code header on every request (set by AdminGate)
  const adminCode =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('chronicle_admin_code') || ''
      : '';

  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(adminCode ? { 'X-Admin-Code': adminCode } : {}),
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
 */
export const apiGet = (path, params = {}) => {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const qs = filtered.length ? '?' + new URLSearchParams(filtered).toString() : '';
  return apiFetch(`${path}${qs}`);
};

/**
 * POST request with JSON body
 */
export const apiPost = (path, body, options = {}) =>
  apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options });

/**
 * PUT request with JSON body
 */
export const apiPut = (path, body, options = {}) =>
  apiFetch(path, { method: 'PUT', body: JSON.stringify(body), ...options });

/**
 * DELETE request
 */
export const apiDelete = (path, options = {}) =>
  apiFetch(path, { method: 'DELETE', ...options });

/**
 * AI LLM invocation shorthand
 */
export const apiAI = (prompt, response_json_schema, model) =>
  apiPost('/api/ai/invoke-llm', { prompt, response_json_schema, model });

/**
 * Get admin headers (X-Admin-Code) from session storage
 */
export const getAdminHeaders = () => ({
  'X-Admin-Code': typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('chronicle_admin_code') || ''
    : '',
});

export default { apiGet, apiPost, apiPut, apiDelete, apiAI, getAdminHeaders };
