import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import type { ISO8601DateTime, Ride } from 'shared';
import MyRidesPage from '../src/pages/MyRidesPage';
import * as authApi from '../src/api/auth';
import * as ridesApi from '../src/api/rides';

// Helper to cast string to ISO8601DateTime for tests
function toISO8601(date: string): ISO8601DateTime {
  return date as ISO8601DateTime;
}

// Build a ride fixture with sensible defaults.
function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: 1,
    user_id: 1,
    departure: 'Berlin',
    destination: 'München',
    departure_time: toISO8601('2026-06-23T14:30:00Z'),
    available_seats: 3,
    created_at: toISO8601('2026-06-22T10:00:00Z'),
    ...overrides,
  };
}

// Mock both auth and rides APIs
vi.mock('../src/api/auth', () => ({
  getAuthStatus: vi.fn(),
}));

vi.mock('../src/api/rides', () => ({
  getMyRides: vi.fn(),
  createRide: vi.fn(),
}));

const mockedGetAuthStatus = vi.mocked(authApi.getAuthStatus);
const mockedGetMyRides = vi.mocked(ridesApi.getMyRides);
const mockedCreateRide = vi.mocked(ridesApi.createRide);

const renderAtMyRides = () => {
  return render(
    <MemoryRouter initialEntries={['/my-rides']}>
      <Routes>
        <Route path="/my-rides" element={<MyRidesPage />} />
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('MyRidesPage', () => {
  beforeEach(() => {
    mockedGetAuthStatus.mockReset();
    mockedGetMyRides.mockReset();
    mockedCreateRide.mockReset();
  });

  it('loads rides on mount when authenticated', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(true);
    mockedGetMyRides.mockResolvedValueOnce({
      success: true,
      data: [makeRide({ departure: 'Berlin' })],
    });

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByText('Meine Fahrten')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
    });
  });

  it('redirects to /login when not authenticated', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(false);

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    });
    // The page must not even attempt to load rides for an anonymous visitor.
    expect(mockedGetMyRides).not.toHaveBeenCalled();
  });

  it('shows error message when getMyRides fails', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(true);
    mockedGetMyRides.mockResolvedValueOnce({
      success: false,
      error: 'Fehler beim Laden',
    });

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden')).toBeInTheDocument();
    });
  });

  it('reloads the list after a ride is created', async () => {
    mockedGetAuthStatus.mockResolvedValueOnce(true);
    // First load: empty. After creation: the page reloads and shows the new ride.
    mockedGetMyRides
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: [makeRide({ departure: 'Hamburg' })] });
    mockedCreateRide.mockResolvedValueOnce({ success: true, data: makeRide() });

    renderAtMyRides();

    await waitFor(() => {
      expect(screen.getByText('Du hast noch keine Fahrten angeboten.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Start-Ort'), { target: { value: 'Hamburg' } });
    fireEvent.change(screen.getByLabelText('Ziel-Ort'), { target: { value: 'Köln' } });
    fireEvent.change(screen.getByLabelText('Abfahrtszeit'), {
      target: { value: '2027-01-01T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: /fahrt anbieten/i }));

    // The newly created ride appears, which can only happen via a reload.
    await waitFor(() => {
      expect(screen.getByText('Hamburg')).toBeInTheDocument();
    });
    expect(mockedCreateRide).toHaveBeenCalledOnce();
    expect(mockedGetMyRides).toHaveBeenCalledTimes(2);
  });
});
