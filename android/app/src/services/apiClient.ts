import {API_CONFIG} from '../config/api';

export class ApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

interface ApiClientHandlers {
  getAccessToken: () => Promise<string | null>;
  onUnauthorized: () => Promise<void>;
}

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

let handlers: ApiClientHandlers | undefined;
let unauthorizedOperation: Promise<void> | undefined;

export function configureApiClient(nextHandlers: ApiClientHandlers) {
  handlers = nextHandlers;
}

export function apiUrl(path: string): string {
  return `${API_CONFIG.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  const {authenticated = true, headers, signal, ...requestOptions} = options;

  try {
    const token = authenticated ? await handlers?.getAccessToken() : null;
    if (signal?.aborted) {
      controller.abort();
    }
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/json');
    // Multipart bodies need the runtime to set the boundary itself.
    if (requestOptions.body && !(requestOptions.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    const abortRequest = () => controller.abort();
    signal?.addEventListener('abort', abortRequest, {once: true});

    let response: Response;
    try {
      response = await fetch(apiUrl(path), {
        ...requestOptions,
        headers: requestHeaders,
        signal: controller.signal,
      });
    } finally {
      signal?.removeEventListener('abort', abortRequest);
    }

    const data = await response.json().catch(() => null);
    if (response.status === 401 && authenticated && handlers) {
      if (!unauthorizedOperation) {
        unauthorizedOperation = handlers.onUnauthorized().finally(() => {
          unauthorizedOperation = undefined;
        });
      }
      await unauthorizedOperation;
    }

    if (!response.ok) {
      const message =
        typeof data?.message === 'string'
          ? data.message
          : `Permintaan gagal (${response.status}).`;
      throw new ApiError(message, response.status);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      if (signal?.aborted) {
        throw error;
      }
      throw new ApiError('Request timeout. Silakan coba kembali.');
    }
    throw new ApiError('Tidak dapat terhubung ke server.');
  } finally {
    clearTimeout(timeoutId);
  }
}