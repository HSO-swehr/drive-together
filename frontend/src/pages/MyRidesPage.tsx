import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Ride } from 'shared';
import { getAuthStatus } from '../api/auth';
import { getMyRides } from '../api/rides';
import CreateRideForm from '../components/CreateRideForm';
import RidesList from '../components/RidesList';

/**
 * Page for authenticated users to manage their rides.
 * Top: form to create a new ride.
 * Bottom: table of existing rides.
 *
 * Redirects to login if not authenticated.
 */
export default function MyRidesPage() {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth and load rides on mount
  useEffect(() => {
    async function checkAuthAndLoadRides(): Promise<void> {
      const authenticated = await getAuthStatus();
      if (!authenticated) {
        navigate('/login');
        return;
      }

      const response = await getMyRides();
      if (response.success) {
        setRides(response.data);
      } else {
        setError(response.error ?? 'Fehler beim Laden der Fahrten.');
      }
      setLoading(false);
    }

    checkAuthAndLoadRides();
  }, [navigate]);

  async function handleRideCreated(): Promise<void> {
    // Reload rides after successful creation
    const response = await getMyRides();
    if (response.success) {
      setRides(response.data);
      setError(null);
    } else {
      setError(response.error ?? 'Fehler beim Laden der Fahrten.');
    }
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <p className="text-muted">Laden…</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Meine Fahrten</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <CreateRideForm onSuccess={handleRideCreated} />

      <RidesList rides={rides} />
    </div>
  );
}
