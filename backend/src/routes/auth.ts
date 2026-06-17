import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { AuthRegisterRequest, AuthRegisterResponse } from 'shared';
import { userExists, createUser, createSession } from '../db.js';

// bcrypt work factor. Higher = slower = more resistant to brute force.
const BCRYPT_ROUNDS = 10;

// Validation happens at the API edge via Fastify's JSON schema. The email is
// checked structurally (length) and with a pragmatic pattern; the password only
// needs a minimum length per the user story.
const EMAIL_PATTERN = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
const EMAIL_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 4;

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', maxLength: EMAIL_MAX_LENGTH, pattern: EMAIL_PATTERN },
      password: { type: 'string', minLength: PASSWORD_MIN_LENGTH },
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

/** Authentication routes (registration; login etc. follow later). */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: AuthRegisterRequest; Reply: AuthRegisterResponse }>(
    '/api/auth/register',
    { schema: registerSchema, attachValidation: true },
    async (request, reply) => {
      // Schema validation errors are attached (not auto-sent) so we can answer
      // with the shared error shape instead of Fastify's default 400 body.
      if (request.validationError) {
        return reply.code(400).send({
          success: false,
          error: `Ungültige Eingabe: gültige E-Mail (max. ${EMAIL_MAX_LENGTH} Zeichen) und Passwort (min. ${PASSWORD_MIN_LENGTH} Zeichen) erforderlich.`,
        });
      }

      const { email, password } = request.body;

      // Fast path: clean 409 without doing the (expensive) hash work.
      if (userExists(email)) {
        return reply
          .code(409)
          .send({ success: false, error: 'Diese E-Mail ist bereits registriert.' });
      }

      try {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const userId = createUser(email, passwordHash);
        const sessionId = createSession(userId);

        // Session cookie. Secure is accepted on localhost by modern browsers.
        // The session id travels only in the HttpOnly cookie, never in the
        // response body, so it stays out of reach of frontend JavaScript.
        reply.header('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/`);

        return reply.code(201).send({ success: true });
      } catch (error) {
        // Guards the check-then-insert race: a concurrent request may have
        // inserted the same email between userExists() and createUser().
        if (isUniqueViolation(error)) {
          return reply
            .code(409)
            .send({ success: false, error: 'Diese E-Mail ist bereits registriert.' });
        }
        request.log.error(error, 'Registration failed');
        return reply.code(500).send({ success: false, error: 'Interner Serverfehler.' });
      }
    }
  );
}
