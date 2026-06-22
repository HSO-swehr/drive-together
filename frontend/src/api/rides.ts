import type { CreateRideRequest, RideCreateResponse, RidesListResponse } from 'shared';

const NETWORK_ERROR: RideCreateResponse = {
  success: false,
  error: 'Netzwerkfehler. Bitte versuche es später erneut.',
};

const NETWORK_ERROR_RIDES: RidesListResponse = {
  success: false,
  error: 'Netzwerkfehler. Bitte versuche es später erneut.',
};

/**
 * Create a new ride via POST /api/rides.
 * Returns the backend's RideCreateResponse (success or error).
 * Network/parse failures map to the same error shape.
 */
export async function createRide(data: CreateRideRequest): Promise<RideCreateResponse> {
  try {
    const response = await fetch('/api/rides', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()) as RideCreateResponse;
  } catch {
    return NETWORK_ERROR;
  }
}

/**
 * Fetch the authenticated user's rides from GET /api/rides/my-rides.
 * Returns RidesListResponse (success or error).
 */
export async function getMyRides(): Promise<RidesListResponse> {
  try {
    const response = await fetch('/api/rides/my-rides');
    if (!response.ok) {
      return NETWORK_ERROR_RIDES;
    }
    return (await response.json()) as RidesListResponse;
  } catch {
    return NETWORK_ERROR_RIDES;
  }
}
