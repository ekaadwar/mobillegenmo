import { API_BASE_URL } from '@env';

export const API_CONFIG = {
  baseUrl: API_BASE_URL,

  timeout: 15_000,
} as const;