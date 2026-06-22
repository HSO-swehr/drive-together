/* eslint-disable @typescript-eslint/no-explicit-any, no-undef */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CreateRideForm from '../src/components/CreateRideForm';
import * as ridesApi from '../src/api/rides';

// Mock the rides API
vi.mock('../src/api/rides', () => ({
  createRide: vi.fn(),
}));

const mockedCreateRide = vi.mocked(ridesApi.createRide);

const departure = () => screen.getByLabelText('Start-Ort');
const destination = () => screen.getByLabelText('Ziel-Ort');
const departureTime = () => screen.getByLabelText('Abfahrtszeit');
const availableSeats = () => screen.getByLabelText('Freie Plätze');
const submitButton = () => screen.getByRole('button', { name: /fahrt anbieten|biete an/i });

const fill = () => {
  fireEvent.change(departure(), { target: { value: 'Berlin' } });
  fireEvent.change(destination(), { target: { value: 'München' } });
  fireEvent.change(departureTime(), { target: { value: '2026-06-23T14:30' } });
  fireEvent.change(availableSeats(), { target: { value: '3' } });
};

describe('CreateRideForm', () => {
  beforeEach(() => {
    mockedCreateRide.mockReset();
  });

  it('renders all 4 input fields and a submit button', () => {
    render(<CreateRideForm />);
    expect(departure()).toBeInTheDocument();
    expect(destination()).toBeInTheDocument();
    expect(departureTime()).toBeInTheDocument();
    expect(availableSeats()).toBeInTheDocument();
    expect(submitButton()).toBeInTheDocument();
  });

  it('disables submit until all fields are filled', () => {
    render(<CreateRideForm />);
    expect(submitButton()).toBeDisabled();

    fill();
    expect(submitButton()).not.toBeDisabled();
  });

  it('calls createRide with correct payload on successful submission', async () => {
    mockedCreateRide.mockResolvedValueOnce({ success: true, data: {} as any });

    render(<CreateRideForm />);
    fill();
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(mockedCreateRide).toHaveBeenCalledOnce();
    });

    const call = mockedCreateRide.mock.calls[0]?.[0];
    expect(call?.departure).toBe('Berlin');
    expect(call?.destination).toBe('München');
    expect(call?.available_seats).toBe(3);
  });

  it('clears form after successful submission', async () => {
    mockedCreateRide.mockResolvedValueOnce({ success: true, data: {} as any });

    render(<CreateRideForm />);
    fill();
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect((departure() as HTMLInputElement).value).toBe('');
      expect((destination() as HTMLInputElement).value).toBe('');
      expect((availableSeats() as HTMLInputElement).value).toBe('1');
    });
  });

  it('displays error message on failed submission', async () => {
    mockedCreateRide.mockResolvedValueOnce({
      success: false,
      error: 'Validierungsfehler',
    } as any);

    render(<CreateRideForm />);
    fill();
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByText('Validierungsfehler')).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback after successful submission', async () => {
    const onSuccess = vi.fn();
    mockedCreateRide.mockResolvedValueOnce({
      success: true,
      data: {
        id: 1,
        user_id: 1,
        departure: 'Berlin',
        destination: 'München',
        departure_time: '2026-06-23T14:30:00Z' as any,
        available_seats: 3,
        created_at: '2026-06-22T10:00:00Z' as any,
      },
    });

    render(<CreateRideForm onSuccess={onSuccess} />);
    fill();
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it('shows loading text during submission', async () => {
    mockedCreateRide.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, data: {} as any }), 100);
        })
    );

    render(<CreateRideForm />);
    fill();
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByText('Biete an…')).toBeInTheDocument();
    });
  });
});
