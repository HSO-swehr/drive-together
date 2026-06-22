import type { Ride } from 'shared';
import { formatLocalDateTime } from '../utils/datetime';

interface RidesListProps {
  rides: Ride[];
}

/**
 * Display rides in a responsive Bootstrap table.
 * Shows departure, destination, departure_time (formatted), and available_seats.
 */
export default function RidesList({ rides }: RidesListProps) {
  if (rides.length === 0) {
    return <p className="text-muted">Du hast noch keine Fahrten angeboten.</p>;
  }

  /**
   * Format seats with correct German singular/plural.
   */
  function formatSeats(count: number): string {
    return count === 1 ? '1 Platz' : `${count} Plätze`;
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Start</th>
            <th>Ziel</th>
            <th>Abfahrt</th>
            <th>Plätze</th>
          </tr>
        </thead>
        <tbody>
          {rides.map((ride) => (
            <tr key={ride.id}>
              <td>{ride.departure}</td>
              <td>{ride.destination}</td>
              <td>{formatLocalDateTime(ride.departure_time)}</td>
              <td>{formatSeats(ride.available_seats)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
