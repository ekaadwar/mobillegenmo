export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}