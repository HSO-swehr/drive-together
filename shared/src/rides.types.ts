/**
 * Rides types — shared between backend and frontend.
 * Represents ride offers made by drivers.
 */

import type { ApiResponse } from './api.types.js';

/**
 * ISO 8601 DateTime as a branded string type for improved type safety.
 * While transmitted as a string in JSON, this type helps prevent any string
 * from being used where a datetime is expected.
 *
 * Note: Runtime validation happens via JSON schema, not TypeScript.
 * This is purely for type-checking and documentation.
 */
export type ISO8601DateTime = string & { readonly __brand: 'ISO8601DateTime' };

/**
 * Core Ride model.
 * Represents a ride offer by a driver.
 */
export interface Ride {
  id: number;
  user_id: number;
  departure: string;
  destination: string;
  departure_time: ISO8601DateTime;
  available_seats: number;
  created_at: ISO8601DateTime;
}

/**
 * Request body for POST /api/rides
 * User-provided fields (id, user_id, created_at are assigned by the server)
 */
export interface CreateRideRequest {
  departure: string;
  destination: string;
  departure_time: ISO8601DateTime;
  available_seats: number;
}

/**
 * Response body for POST /api/rides.
 * 201 → the created Ride (with server-assigned fields); 400/401 → an error.
 */
export type RideCreateResponse = ApiResponse<Ride>;

/**
 * Response body for GET /api/rides/my-rides.
 * 200 → the authenticated user's rides, sorted by departure_time; 401 → an error.
 */
export type RidesListResponse = ApiResponse<Ride[]>;
