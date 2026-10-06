export const API_CONFIG = {
  baseUrl: __DEV__
    ? 'http://10.0.2.2:3000/api/v1'
    : 'https://api.mobillegend.com/api/v1',

  timeout: 15_000,
} as const;