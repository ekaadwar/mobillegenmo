import {API_CONFIG} from '../config/api';
import {ApiError} from './apiClient';

import {
  AuthErrorResponse,
  LoginRequest,
  LoginResponse,
} from '../types/auth';

export {ApiError};

export async function loginApi(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, API_CONFIG.timeout);

  try {
    const response = await fetch(
      `${API_CONFIG.baseUrl}/auth/login`,
      {
        method: 'POST',

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(payload),

        signal: controller.signal,
      },
    );

    const data = (await response
      .json()
      .catch(() => null)) as
      | LoginResponse
      | AuthErrorResponse
      | null;

    if (!response.ok) {
      const errorResponse =
        data as AuthErrorResponse | null;

      throw new ApiError(
        response.status === 401
          ? 'Username atau password salah'
          : errorResponse?.message ?? 'Terjadi kesalahan pada server.',
        response.status,
      );
    }

    const loginResponse = data as LoginResponse;

    if (!loginResponse?.accessToken) {
      throw new ApiError(
        'Response login tidak memiliki access token.',
      );
    }

    return loginResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw new ApiError(
        'Request timeout. Silakan coba kembali.',
      );
    }

    throw new ApiError(
      'Tidak dapat terhubung ke server.',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}