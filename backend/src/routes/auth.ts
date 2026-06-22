import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { AuthRequest, AuthResponse, AuthMeResponse } from 'shared';
import { EMAIL_PATTERN, EMAIL_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from 'shared';
import { createUser, getUserByEmail, createSession, getSessionUser } from '../db.js';
import { parseSessionCookie } from '../auth-utils.js';

// bcrypt work factor. Higher = slower = more resistant to brute force.
const BCRYPT_ROUNDS = 10;

const EMAIL_TAKEN_MESSAGE = 'Diese E-Mail ist bereits registriert.';
// Same message for unknown email and wrong password, so the response does not
// reveal whether an email is registered (avoids user enumeration).
const INVALID_CREDENTIALS_MESSAGE = 'E-Mail oder Passwort falsch.';

// Validation happens at the API edge via Fastify's JSON schema, built from the
// same constants the frontend validates against (shared/auth.validation) so the
// two layers cannot drift apart.

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', maxLength: EMAIL_MAX_LENGTH, pattern: EMAIL_PATTERN },
      password: { type: 'string', minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH },
    },
  },
} as const;

// Login validates only loosely: non-empty strings within the same upper length
// bounds. Anything that does not match a stored credential is answered with a
// generic 401, not a 400 — strict format checks here would only leak which
// inputs are "well-formed" and reject legitimate older credentials.
const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', minLength: 1, maxLength: EMAIL_MAX_LENGTH },
      password: { type: 'string', minLength: 1, maxLength: PASSWORD_MAX_LENGTH },
    },
  },
} as const;

/** True if the error is a SQLite UNIQUE-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}

/** Authentication routes: registration and login. */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: AuthRequest; Reply: AuthResponse }>(
    '/api/auth/register',
    { schema: registerSchema, attachValidation: true },
    async (request, reply) => {
      // Schema validation errors are attached (not auto-sent) so we can answer
      // with the shared error shape instead of Fastify's default 400 body.
      if (request.validationError) {
        return reply.code(400).send({
          success: false,
          error: `Ungültige Eingabe: gültige E-Mail (max. ${EMAIL_MAX_LENGTH} Zeichen) und Passwort (${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} Zeichen) erforderlich.`,
        });
      }

      const { email, password } = request.body;

      try {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        createUser(email, passwordHash);

        // Registration does not log the user in — that is User Story 2 (login).
        return reply.code(201).send({ success: true });
      } catch (error) {
        // The UNIQUE constraint on email is the single source of truth for
        // duplicates: no pre-check, just translate the violation into a 409.
        if (isUniqueViolation(error)) {
          return reply.code(409).send({ success: false, error: EMAIL_TAKEN_MESSAGE });
        }
        request.log.error(error, 'Registration failed');
        return reply.code(500).send({ success: false, error: 'Interner Serverfehler.' });
      }
    }
  );

  fastify.post<{ Body: AuthRequest; Reply: AuthResponse }>(
    '/api/auth/login',
    { schema: loginSchema, attachValidation: true },
    async (request, reply) => {
      if (request.validationError) {
        return reply
          .code(400)
          .send({ success: false, error: 'E-Mail und Passwort sind erforderlich.' });
      }

      const { email, password } = request.body;

      try {
        const user = getUserByEmail(email);
        // Note: no constant-time dummy hash for unknown emails — timing-based
        // enumeration hardening is intentionally out of scope (minimal auth).
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
          return reply.code(401).send({ success: false, error: INVALID_CREDENTIALS_MESSAGE });
        }

        const sessionId = createSession(user.id);

        // The session id travels only in the HttpOnly cookie, never in the
        // response body. Secure is accepted on localhost by modern browsers.
        reply.header('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/`);

        return reply.code(200).send({ success: true });
      } catch (error) {
        request.log.error(error, 'Login failed');
        return reply.code(500).send({ success: false, error: 'Interner Serverfehler.' });
      }
    }
  );

  // Session status for the frontend. Always 200 (it is a status query, not a
  // protected resource): the body's `authenticated` flag tells the start page
  // whether to render the logged-in or the anonymous view.
  fastify.get<{ Reply: AuthMeResponse }>('/api/auth/me', async (request, reply) => {
    const sessionId = parseSessionCookie(request.headers.cookie);
    const authenticated = sessionId !== null && getSessionUser(sessionId) !== null;
    return reply.code(200).send({ authenticated });
  });
}
