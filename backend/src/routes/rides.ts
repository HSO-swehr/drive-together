import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { CreateRideRequest, RideCreateResponse, RidesListResponse } from 'shared';
import {
  DEPARTURE_MIN_LENGTH,
  DEPARTURE_MAX_LENGTH,
  DESTINATION_MIN_LENGTH,
  DESTINATION_MAX_LENGTH,
  AVAILABLE_SEATS_MIN,
  AVAILABLE_SEATS_MAX,
} from 'shared';
import { createRide, getMyRides } from '../db.js';
import { getAuthenticatedUserId } from '../auth-utils.js';

/**
 * Fastify JSON schema for POST /api/rides request.
 */
const createRideSchema = {
  body: {
    type: 'object',
    required: ['departure', 'destination', 'departure_time', 'available_seats'],
    additionalProperties: false,
    properties: {
      departure: {
        type: 'string',
        minLength: DEPARTURE_MIN_LENGTH,
        maxLength: DEPARTURE_MAX_LENGTH,
      },
      destination: {
        type: 'string',
        minLength: DESTINATION_MIN_LENGTH,
        maxLength: DESTINATION_MAX_LENGTH,
      },
      departure_time: { type: 'string', format: 'date-time' },
      available_seats: {
        type: 'integer',
        minimum: AVAILABLE_SEATS_MIN,
        maximum: AVAILABLE_SEATS_MAX,
      },
    },
  },
} as const;

/**
 * Fastify JSON schema for POST /api/rides response (201).
 */
const createRideResponseSchema = {
  response: {
    201: {
      type: 'object',
      required: ['success', 'data'],
      additionalProperties: false,
      properties: {
        success: { const: true },
        data: {
          type: 'object',
          required: [
            'id',
            'user_id',
            'departure',
            'destination',
            'departure_time',
            'available_seats',
            'created_at',
          ],
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            departure: { type: 'string' },
            destination: { type: 'string' },
            departure_time: { type: 'string', format: 'date-time' },
            available_seats: {
              type: 'integer',
              minimum: AVAILABLE_SEATS_MIN,
              maximum: AVAILABLE_SEATS_MAX,
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    400: {
      type: 'object',
      required: ['success', 'error'],
      additionalProperties: false,
      properties: {
        success: { const: false },
        error: { type: 'string', minLength: 1 },
      },
    },
    401: {
      type: 'object',
      required: ['success', 'error'],
      additionalProperties: false,
      properties: {
        success: { const: false },
        error: { type: 'string', minLength: 1 },
      },
    },
  },
} as const;

/**
 * Fastify JSON schema for GET /api/rides/my-rides response (200).
 */
const myRidesResponseSchema = {
  response: {
    200: {
      type: 'object',
      required: ['success', 'data'],
      additionalProperties: false,
      properties: {
        success: { const: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            required: [
              'id',
              'user_id',
              'departure',
              'destination',
              'departure_time',
              'available_seats',
              'created_at',
            ],
            properties: {
              id: { type: 'integer' },
              user_id: { type: 'integer' },
              departure: { type: 'string' },
              destination: { type: 'string' },
              departure_time: { type: 'string', format: 'date-time' },
              available_seats: {
                type: 'integer',
                minimum: AVAILABLE_SEATS_MIN,
                maximum: AVAILABLE_SEATS_MAX,
              },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    401: {
      type: 'object',
      required: ['success', 'error'],
      additionalProperties: false,
      properties: {
        success: { const: false },
        error: { type: 'string', minLength: 1 },
      },
    },
  },
} as const;

/**
 * Turn Fastify's first JSON-schema validation failure into a specific German
 * message. Avoids the misleading blanket "all fields required" by naming the
 * field and constraint that actually failed.
 */
function validationMessage(
  error:
    | {
        validation?: Array<{
          instancePath?: string;
          keyword?: string;
          params?: Record<string, unknown>;
        }>;
      }
    | undefined
): string {
  const first = error?.validation?.[0];
  if (!first) return 'Ungültige Eingabe.';

  const field =
    first.keyword === 'required'
      ? `/${String(first.params?.missingProperty ?? '')}`
      : (first.instancePath ?? '');

  switch (field) {
    case '/departure':
      return `Bitte einen gültigen Start-Ort angeben (1–${DEPARTURE_MAX_LENGTH} Zeichen).`;
    case '/destination':
      return `Bitte einen gültigen Ziel-Ort angeben (1–${DESTINATION_MAX_LENGTH} Zeichen).`;
    case '/departure_time':
      return 'Bitte eine gültige Abfahrtszeit angeben.';
    case '/available_seats':
      return `Die Anzahl freier Sitzplätze muss zwischen ${AVAILABLE_SEATS_MIN} und ${AVAILABLE_SEATS_MAX} liegen.`;
    default:
      return 'Ungültige Eingabe.';
  }
}

/**
 * Rides routes: create and manage ride offers.
 */
export async function ridesRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/rides
   * Create a new ride offer.
   * Requires authentication.
   */
  fastify.post<{ Body: CreateRideRequest; Reply: RideCreateResponse }>(
    '/api/rides',
    { schema: { ...createRideSchema, ...createRideResponseSchema }, attachValidation: true },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check authentication
      const userId = getAuthenticatedUserId(request);
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Authentifizierung erforderlich.' });
      }

      // Check request validation
      if (request.validationError) {
        return reply.code(400).send({
          success: false,
          error: validationMessage(request.validationError),
        });
      }

      const { departure, destination, departure_time, available_seats } =
        request.body as CreateRideRequest;

      try {
        // Validate that departure_time is in the future
        const departureDate = new Date(departure_time);
        if (departureDate <= new Date()) {
          return reply.code(400).send({
            success: false,
            error: 'Die Abfahrtszeit muss in der Zukunft liegen.',
          });
        }

        const ride = createRide(userId, departure, destination, departure_time, available_seats);
        return reply.code(201).send({ success: true, data: ride });
      } catch (error) {
        request.log.error(error, 'Failed to create ride');
        return reply.code(500).send({ success: false, error: 'Interner Serverfehler.' });
      }
    }
  );

  /**
   * GET /api/rides/my-rides
   * Get all rides offered by the authenticated user, sorted by departure_time.
   * Requires authentication.
   */
  fastify.get<{ Reply: RidesListResponse }>(
    '/api/rides/my-rides',
    { schema: myRidesResponseSchema },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check authentication
      const userId = getAuthenticatedUserId(request);
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Authentifizierung erforderlich.' });
      }

      try {
        const rides = getMyRides(userId);
        return reply.code(200).send({ success: true, data: rides });
      } catch (error) {
        request.log.error(error, 'Failed to fetch rides');
        return reply.code(500).send({ success: false, error: 'Interner Serverfehler.' });
      }
    }
  );
}
