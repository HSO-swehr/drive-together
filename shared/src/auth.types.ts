/**
 * Authentication Types — Shared between Backend and Frontend
 */

export interface AuthRegisterRequest {
  email: string;
  password: string;
}

export interface AuthRegisterResponseSuccess {
  success: true;
}

export interface AuthRegisterResponseError {
  success: false;
  error: string;
}

export type AuthRegisterResponse = AuthRegisterResponseSuccess | AuthRegisterResponseError;
