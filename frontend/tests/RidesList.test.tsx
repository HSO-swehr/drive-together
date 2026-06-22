import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Ride, ISO8601DateTime } from 'shared';
import RidesList from '../src/components/RidesList';

// Helper to cast string to ISO8601DateTime for tests
function toISO8601(date: string): ISO8601DateTime {
  return date as ISO8601DateTime;
}

describe('RidesList', () => {
  it('renders table with correct headers', () => {
    const rides: Ride[] = [
      {
        id: 1,
        user_id: 1,
        departure: 'Berlin',
        destination: 'München',
        departure_time: toISO8601('2026-06-23T14:30:00Z'),
        available_seats: 3,
        created_at: toISO8601('2026-06-22T10:00:00Z'),
      },
    ];
    render(<RidesList rides={rides} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Ziel')).toBeInTheDocument();
    expect(screen.getByText('Abfahrt')).toBeInTheDocument();
    expect(screen.getByText('Plätze')).toBeInTheDocument();
  });

  it('renders each ride in a table row', () => {
    const rides: Ride[] = [
      {
        id: 1,
        user_id: 1,
        departure: 'Berlin',
        destination: 'München',
        departure_time: toISO8601('2026-06-23T14:30:00Z'),
        available_seats: 3,
        created_at: toISO8601('2026-06-22T10:00:00Z'),
      },
      {
        id: 2,
        user_id: 1,
        departure: 'Hamburg',
        destination: 'Köln',
        departure_time: toISO8601('2026-06-24T10:00:00Z'),
        available_seats: 2,
        created_at: toISO8601('2026-06-22T11:00:00Z'),
      },
    ];

    render(<RidesList rides={rides} />);
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('München')).toBeInTheDocument();
    expect(screen.getByText('Hamburg')).toBeInTheDocument();
    expect(screen.getByText('Köln')).toBeInTheDocument();
  });

  it('formats departure_time correctly (DD.MM.YYYY HH:MM)', () => {
    const rides: Ride[] = [
      {
        id: 1,
        user_id: 1,
        departure: 'Berlin',
        destination: 'München',
        departure_time: toISO8601('2026-06-23T14:30:00Z'),
        available_seats: 3,
        created_at: toISO8601('2026-06-22T10:00:00Z'),
      },
    ];

    render(<RidesList rides={rides} />);
    // Note: Date formatting is timezone-dependent, but the pattern should be DD.MM.YYYY HH:MM
    const timeCell = screen.getByText(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/);
    expect(timeCell).toBeInTheDocument();
  });

  it('displays correct singular/plural for seats', () => {
    const rides: Ride[] = [
      {
        id: 1,
        user_id: 1,
        departure: 'Berlin',
        destination: 'München',
        departure_time: toISO8601('2026-06-23T14:30:00Z'),
        available_seats: 1,
        created_at: toISO8601('2026-06-22T10:00:00Z'),
      },
      {
        id: 2,
        user_id: 1,
        departure: 'Hamburg',
        destination: 'Köln',
        departure_time: toISO8601('2026-06-24T10:00:00Z'),
        available_seats: 2,
        created_at: toISO8601('2026-06-22T11:00:00Z'),
      },
    ];

    render(<RidesList rides={rides} />);
    expect(screen.getByText('1 Platz')).toBeInTheDocument();
    expect(screen.getByText('2 Plätze')).toBeInTheDocument();
  });

  it('shows message when rides list is empty', () => {
    render(<RidesList rides={[]} />);
    expect(screen.getByText('Du hast noch keine Fahrten angeboten.')).toBeInTheDocument();
  });
});
