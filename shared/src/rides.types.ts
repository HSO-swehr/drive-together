/**
 * Rides types — shared between backend and frontend.
 * Represents ride offers made by drivers.
 */

/**
 * Core Ride model.
 * Represents a ride offer by a driver.
 */
export interface Ride {
  id: number;
  user_id: number;
  departure: string;
  destination: string;
  departure_time: string; // ISO 8601 datetime  FIXME: use a proper type not string
  available_seats: number;
  created_at: string; // ISO 8601 datetime      FIXME: use a proper type not string
}

/**
 * Request body for POST /api/rides
 * User-provided fields (id, user_id, created_at are assigned by the server)
 */
export interface CreateRideRequest {
  departure: string;
  destination: string;
  departure_time: string; // ISO 8601 datetime   FIXME: use a proper type not string
  available_seats: number;
}

/**
 * Response body for POST /api/rides (201 Created)
 * Returns the created Ride object with server-assigned fields.
 */
export interface CreateRideResponse {
  success: true;
  data: Ride;
}

/**
 * Response body for POST /api/rides error cases (400, 401)
 */
export interface CreateRideErrorResponse {
  success: false;
  error: string;
}

export type RideCreateResponse = CreateRideResponse | CreateRideErrorResponse;

/**
 * Response body for GET /api/rides/my-rides (200 OK)
 * Returns an array of the authenticated user's rides, sorted by departure_time.
 */
export interface MyRidesResponse {
  success: true;
  data: Ride[];
}

/**
 * Response body for GET /api/rides/my-rides error case (401)
 */
export interface MyRidesErrorResponse {
  success: false;
  error: string;
}

export type RidesListResponse = MyRidesResponse | MyRidesErrorResponse;
