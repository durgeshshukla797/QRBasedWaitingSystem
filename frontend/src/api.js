export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details; // Array of { field, message }
  }
}

/**
 * Universal request helper
 * Handles JSON bodies, credentials: "include", and structured error throwing
 */
export async function request(path, options = {}) {
  const { method = 'GET', body, headers = {}, ...rest } = options;

  const fetchOptions = {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      ...headers,
    },
    ...rest,
  };

  if (body !== undefined) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(path, fetchOptions);

  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => '');
    data = text ? { message: text } : null;
  }

  if (!res.ok) {
    const message = data?.message || res.statusText || 'An error occurred';
    const details = data?.errors || null;
    throw new ApiError(res.status, message, details);
  }

  return data;
}

/**
 * Utility to extract field-specific error messages from ApiError.details
 */
export function getFieldError(error, fieldName) {
  if (!error || !Array.isArray(error.details)) return null;
  const match = error.details.find((d) => d.field === fieldName);
  return match ? match.message : null;
}
