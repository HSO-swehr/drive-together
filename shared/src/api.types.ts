/**
 * Generic API envelope shared between backend and frontend.
 *
 * Every data-returning endpoint answers with the same discriminated union:
 * `{ success: true, data }` on success or `{ success: false, error }` on failure.
 * Endpoints specialize it via the payload type, e.g. `ApiResponse<Ride>`.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
