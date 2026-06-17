/**
 * Authentication Types — Shared between Backend and Frontend.
 *
 * Registration and login share the same wire shape — email + password in,
 * `{ success }` / `{ success, error }` out — so one set of types serves both
 * `/api/auth/register` and `/api/auth/login`.
 */

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponseSuccess {
  success: true;
}

export interface AuthResponseError {
  success: false;
  error: string;
}

export type AuthResponse = AuthResponseSuccess | AuthResponseError;

/**
 * Response of `GET /api/auth/me`: whether the request carries a valid session
 * cookie. Used by the frontend to render the start page in a logged-in vs.
 * anonymous state. No user details are exposed yet — only the boolean.
 */
export interface AuthMeResponse {
  authenticated: boolean;
}
