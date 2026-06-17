import { describe, it, expect } from 'vitest';
import type {
  AuthRegisterRequest,
  AuthRegisterResponseSuccess,
  AuthRegisterResponseError,
  AuthRegisterResponse,
} from '../src/auth.types.js';

describe('Auth Types', () => {
  describe('AuthRegisterRequest', () => {
    it('should have email and password fields', () => {
      const request: AuthRegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(request).toHaveProperty('email');
      expect(request).toHaveProperty('password');
      expect(typeof request.email).toBe('string');
      expect(typeof request.password).toBe('string');
    });
  });

  describe('AuthRegisterResponseSuccess', () => {
    it('should have success=true and sessionId', () => {
      const response: AuthRegisterResponseSuccess = {
        success: true,
        sessionId: 'session-id-123',
      };

      expect(response.success).toBe(true);
      expect(response).toHaveProperty('sessionId');
      expect(typeof response.sessionId).toBe('string');
    });
  });

  describe('AuthRegisterResponseError', () => {
    it('should have success=false and error message', () => {
      const response: AuthRegisterResponseError = {
        success: false,
        error: 'Email already exists',
      };

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
      expect(typeof response.error).toBe('string');
    });
  });

  describe('AuthRegisterResponse', () => {
    it('should accept success response', () => {
      const response: AuthRegisterResponse = {
        success: true,
        sessionId: 'session-123',
      };

      expect(response.success).toBe(true);
    });

    it('should accept error response', () => {
      const response: AuthRegisterResponse = {
        success: false,
        error: 'Invalid email',
      };

      expect(response.success).toBe(false);
    });
  });
});
