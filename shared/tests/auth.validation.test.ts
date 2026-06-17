import { describe, it, expect } from 'vitest';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  isValidPassword,
} from '../src/auth.validation.js';

describe('isValidEmail', () => {
  it('accepts a well-formed address', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects addresses without @ or domain dot', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('rejects addresses with whitespace', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail(' user@example.com')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects an over-long address (> EMAIL_MAX_LENGTH)', () => {
    const longLocal = 'a'.repeat(EMAIL_MAX_LENGTH); // local + domain exceeds limit
    expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
  });

  it('accepts an address exactly at the length limit', () => {
    const domain = '@example.com';
    const local = 'a'.repeat(EMAIL_MAX_LENGTH - domain.length);
    const email = `${local}${domain}`;
    expect(email.length).toBe(EMAIL_MAX_LENGTH);
    expect(isValidEmail(email)).toBe(true);
  });
});

describe('isValidPassword', () => {
  it('accepts a password at or above the minimum length', () => {
    expect(isValidPassword('a'.repeat(PASSWORD_MIN_LENGTH))).toBe(true);
    expect(isValidPassword('longenoughsecret')).toBe(true);
  });

  it('rejects a too-short password', () => {
    expect(isValidPassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});
