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
