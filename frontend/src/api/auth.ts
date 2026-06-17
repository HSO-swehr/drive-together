import type { AuthRequest, AuthResponse } from 'shared';

const NETWORK_ERROR: AuthResponse = {
  success: false,
  error: 'Netzwerkfehler. Bitte versuche es später erneut.',
};

/** POST credentials to an auth endpoint, normalizing failures to AuthResponse. */
async function postAuth(url: string, email: string, password: string): Promise<AuthResponse> {
  const body: AuthRequest = { email, password };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await response.json()) as AuthResponse;
  } catch {
    return NETWORK_ERROR;
  }
}

/**
 * Register a new user. Resolves to the backend's {@link AuthResponse} shape for
 * both success and handled errors (e.g. duplicate email, validation), so callers
 * only branch on `success`. Network/parse failures map to the same error shape.
 */
export function registerUser(email: string, password: string): Promise<AuthResponse> {
  return postAuth('/api/auth/register', email, password);
}

/**
 * Log a user in. Like {@link registerUser}, resolves to an {@link AuthResponse};
 * invalid credentials surface as `{ success: false }`. On success the backend
 * sets the (HttpOnly) session cookie, which is never read here.
 */
export function loginUser(email: string, password: string): Promise<AuthResponse> {
  return postAuth('/api/auth/login', email, password);
}
