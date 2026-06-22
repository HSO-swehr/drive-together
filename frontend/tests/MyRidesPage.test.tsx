/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import type { ISO8601DateTime } from 'shared';
import MyRidesPage from '../src/pages/MyRidesPage';
import * as authApi from '../src/api/auth';
import * as ridesApi from '../src/api/rides';

// Helper to cast string to ISO8601DateTime for tests
function toISO8601(date: string): ISO8601DateTime {
  return date as ISO8601DateTime;
}

// Mock both auth and rides APIs
vi.mock('../src/api/auth', () => ({
  getAuthStatus: vi.fn(),
}));

vi.mock('../src/api/rides', () => ({
  getMyRides: vi.fn(),
}));

const mockedGetAuthStatus = vi.mocked(authApi.getAuthStatus);
const mockedGetMyRides = vi.mocked(ridesApi.getMyRides);

const renderAtMyRides = () => {
  return render(
    <MemoryRouter initialEntries={['/my-rides']}>
      <MyRidesPage />
    </MemoryRouter>
  );
};

describe('MyRidesPage', () => {
  beforeEach(() => {
    mockedGetAuthStatus.mockReset();
    mockedGetMyRides.mockReset();
  });

  it('loads rides on mount when authenticated', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(true);
    mockedGetMyRides.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 1,
          user_id: 1,
          departure: 'Berlin',
          destination: 'München',
          departure_time: toISO8601('2026-06-23T14:30:00Z'),
          available_seats: 3,
          created_at: toISO8601('2026-06-22T10:00:00Z'),
        },
      ],
    });

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByText('Meine Fahrten')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
    });
  });

  it('shows error message when getMyRides fails', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(true);
    mockedGetMyRides.mockResolvedValueOnce({
      success: false,
      error: 'Fehler beim Laden',
    } as any);

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
    });
  });

  it('renders CreateRideForm component', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(true);
    mockedGetMyRides.mockResolvedValueOnce({ success: true, data: [] });

    renderAtMyRides();

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByLabelText('Start-Ort')).toBeInTheDocument();
    });
  });

  it('renders RidesList component', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(true);
    mockedGetMyRides.mockResolvedValueOnce({ success: true, data: [] });

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByText('Du hast noch keine Fahrten angeboten.')).toBeInTheDocument();
    });
  });
});
