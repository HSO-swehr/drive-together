import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import type { AuthRegisterRequest, AuthRegisterResponse } from 'shared';
import { EMAIL_PATTERN, EMAIL_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from 'shared';
import { createUser } from '../db.js';

// bcrypt work factor. Higher = slower = more resistant to brute force.
const BCRYPT_ROUNDS = 10;

const EMAIL_TAKEN_MESSAGE = 'Diese E-Mail ist bereits registriert.';

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
}
