import type { AuthRegisterRequest, AuthRegisterResponse } from 'shared';

/**
 * Register a new user. Resolves to the backend's {@link AuthRegisterResponse}
 * shape for both success and handled errors (e.g. duplicate email, validation),
 * so callers only branch on `success`. Network/parse failures are translated
 * into the same error shape rather than thrown.
 */
export async function registerUser(email: string, password: string): Promise<AuthRegisterResponse> {
  const body: AuthRegisterRequest = { email, password };

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await response.json()) as AuthRegisterResponse;
  } catch {
    return {
      success: false,
      error: 'Netzwerkfehler. Bitte versuche es später erneut.',
    };
  }
}
