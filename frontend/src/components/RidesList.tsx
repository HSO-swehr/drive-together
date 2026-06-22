import type { Ride } from 'shared';

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
   * Format an ISO 8601 datetime string to German format "DD.MM.YYYY HH:MM".
   */
  function formatDateTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
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
              <td>{formatDateTime(ride.departure_time)}</td>
              <td>{formatSeats(ride.available_seats)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
