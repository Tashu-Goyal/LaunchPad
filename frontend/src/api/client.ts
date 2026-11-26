const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface FastApiValidationDetail {
  loc?: Array<string | number>;
  msg?: string;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as { detail?: unknown };
  if (typeof record.detail === 'string') {
    return record.detail;
  }

  if (Array.isArray(record.detail) && record.detail.length > 0) {
    return record.detail
      .map((item) => {
        const entry = item as FastApiValidationDetail;
        const fieldPath = Array.isArray(entry.loc)
          ? entry.loc.filter((part) => part !== 'body').join('.')
          : '';
        const msg = entry.msg ?? 'Invalid input';
        return fieldPath ? `${fieldPath}: ${msg}` : msg;
      })
      .join(' • ');
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Unable to reach the LaunchPad API server. Please ensure the backend is running.',
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const message = extractErrorMessage(
      data,
      `Request failed with status ${response.status}`,
    );
    throw new ApiError(message, response.status);
  }

  return data as T;
}
