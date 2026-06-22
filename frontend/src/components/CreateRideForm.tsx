import { useState, type FormEvent } from 'react';
import type { CreateRideRequest } from 'shared';
import {
  DEPARTURE_MIN_LENGTH,
  DEPARTURE_MAX_LENGTH,
  DESTINATION_MIN_LENGTH,
  DESTINATION_MAX_LENGTH,
  AVAILABLE_SEATS_MIN,
  AVAILABLE_SEATS_MAX,
} from 'shared';
import { createRide } from '../api/rides';
import { localDateTimeToISO } from '../utils/datetime';

interface CreateRideFormProps {
  onSuccess?: () => void;
}

/**
 * Form to create a new ride. Validates input client-side and posts to /api/rides.
 * On success, clears the form and calls the onSuccess callback.
 * On error, displays an error message.
 */
export default function CreateRideForm({ onSuccess }: CreateRideFormProps) {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive the earliest valid datetime (now) in YYYY-MM-DDTHH:MM format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

  const formValid =
    departure.trim().length >= DEPARTURE_MIN_LENGTH &&
    departure.trim().length <= DEPARTURE_MAX_LENGTH &&
    destination.trim().length >= DESTINATION_MIN_LENGTH &&
    destination.trim().length <= DESTINATION_MAX_LENGTH &&
    departureTime !== '' &&
    departureTime >= minDateTime &&
    parseInt(availableSeats, 10) >= AVAILABLE_SEATS_MIN &&
    parseInt(availableSeats, 10) <= AVAILABLE_SEATS_MAX;

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!formValid || loading) return;

    setLoading(true);
    setError(null);

    const data: CreateRideRequest = {
      departure: departure.trim(),
      destination: destination.trim(),
      departure_time: localDateTimeToISO(departureTime),
      available_seats: parseInt(availableSeats, 10),
    };

    const result = await createRide(data);

    if (result.success) {
      // Clear form and notify parent
      setDeparture('');
      setDestination('');
      setDepartureTime('');
      setAvailableSeats('1');
      setError(null);
      onSuccess?.();
      return;
    }

    setError(result.error ?? 'Ein Fehler ist aufgetreten.');
    setLoading(false);
  }

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">Neue Fahrt anbieten</h5>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="departure" className="form-label">
                Start-Ort
              </label>
              <input
                id="departure"
                type="text"
                className="form-control"
                placeholder="z.B. Berlin Zentrum"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                disabled={loading}
                minLength={DEPARTURE_MIN_LENGTH}
                maxLength={DEPARTURE_MAX_LENGTH}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="destination" className="form-label">
                Ziel-Ort
              </label>
              <input
                id="destination"
                type="text"
                className="form-control"
                placeholder="z.B. München Zentrum"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={loading}
                minLength={DESTINATION_MIN_LENGTH}
                maxLength={DESTINATION_MAX_LENGTH}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="departureTime" className="form-label">
                Abfahrtszeit
              </label>
              <input
                id="departureTime"
                type="datetime-local"
                className="form-control"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                disabled={loading}
                min={minDateTime}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="availableSeats" className="form-label">
                Freie Plätze
              </label>
              <input
                id="availableSeats"
                type="number"
                className="form-control"
                value={availableSeats}
                onChange={(e) => setAvailableSeats(e.target.value)}
                disabled={loading}
                min={AVAILABLE_SEATS_MIN}
                max={AVAILABLE_SEATS_MAX}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!formValid || loading}>
            {loading ? 'Biete an…' : 'Fahrt anbieten'}
          </button>
        </form>
      </div>
    </div>
  );
}
