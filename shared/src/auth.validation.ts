/**
 * Shared auth input validation — single source of truth for backend and frontend.
 *
 * The backend uses EMAIL_PATTERN / the length limits to build its Fastify JSON
 * schema; the frontend uses isValidEmail / isValidPassword for live validation.
 * Keeping both on the same constants prevents the two layers from drifting apart.
 */

// Pragmatic email check: non-empty local part, '@', domain with a dot. Stored as
// a string (not a RegExp) so it can be dropped straight into a JSON schema's
// `pattern`. Per the user story, email verification is intentionally out of scope.
export const EMAIL_PATTERN = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';

export const EMAIL_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 4;

const EMAIL_REGEX = new RegExp(EMAIL_PATTERN);

/** True if the email matches the pattern and is within the length limit. */
export function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(email);
}

/** True if the password meets the minimum length. */
export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}
