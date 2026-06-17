import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import type { AuthRegisterResponse } from 'shared';
import App from '../src/App';
import { registerUser } from '../src/api/auth';

// The API client is mocked so the form is tested in isolation (no real fetch).
vi.mock('../src/api/auth', () => ({
  registerUser: vi.fn(),
}));

const mockedRegister = vi.mocked(registerUser);

/** Render the app router starting on the registration route. */
function renderAtRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <App />
    </MemoryRouter>
  );
}

const emailInput = () => screen.getByLabelText('E-Mail');
const passwordInput = () => screen.getByLabelText('Passwort');
// Matches both the idle ("Registrieren") and loading ("Registriere…") labels.
const submitButton = () => screen.getByRole('button', { name: /registrier/i });

const fillValid = () => {
  fireEvent.change(emailInput(), { target: { value: 'new@example.com' } });
  fireEvent.change(passwordInput(), { target: { value: 'secret' } });
};

describe('RegisterForm', () => {
  beforeEach(() => {
    mockedRegister.mockReset();
  });

  it('renders email + password fields and a submit button', () => {
    renderAtRegister();
    expect(emailInput()).toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
    expect(submitButton()).toBeInTheDocument();
  });

  it('disables submit while input is invalid and enables it once valid', () => {
    renderAtRegister();
    expect(submitButton()).toBeDisabled();

    fireEvent.change(emailInput(), { target: { value: 'not-an-email' } });
    fireEvent.change(passwordInput(), { target: { value: 'ab' } });
    expect(submitButton()).toBeDisabled();

    fillValid();
    expect(submitButton()).toBeEnabled();
  });

  it('shows live validation hints for invalid email and short password', () => {
    renderAtRegister();

    fireEvent.change(emailInput(), { target: { value: 'broken' } });
    expect(screen.getByText(/gültige E-Mail-Adresse/i)).toBeInTheDocument();

    fireEvent.change(passwordInput(), { target: { value: 'ab' } });
    expect(screen.getByText(/mindestens .* Zeichen/i)).toBeInTheDocument();
  });

  it('navigates to /login on success and disables the button while loading', async () => {
    // Controlled promise so we can observe the in-flight (loading) state.
    let resolve!: (r: AuthRegisterResponse) => void;
    mockedRegister.mockReturnValue(
      new Promise<AuthRegisterResponse>((r) => {
        resolve = r;
      })
    );

    renderAtRegister();
    fillValid();
    fireEvent.click(submitButton());

    // In flight: button disabled, registerUser called with the entered values.
    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(mockedRegister).toHaveBeenCalledWith('new@example.com', 'secret');

    resolve({ success: true });

    // Navigated to the login route (placeholder heading rendered).
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Anmelden' })).toBeInTheDocument()
    );
  });

  it('shows the backend error and re-enables the button on failure', async () => {
    mockedRegister.mockResolvedValue({
      success: false,
      error: 'Diese E-Mail ist bereits registriert.',
    });

    renderAtRegister();
    fillValid();
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(screen.getByText('Diese E-Mail ist bereits registriert.')).toBeInTheDocument()
    );
    // Still on the registration route, button usable again.
    expect(submitButton()).toBeEnabled();
  });
});
