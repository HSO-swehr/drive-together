import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import App from '../src/App';
import { loginUser } from '../src/api/auth';

// The API client is mocked so the form is tested in isolation (no real fetch).
// getAuthStatus is stubbed too: a successful login navigates to the start page,
// which queries it — return true there so HomePage renders the logged-in view.
vi.mock('../src/api/auth', () => ({
  loginUser: vi.fn(),
  getAuthStatus: vi.fn().mockResolvedValue(true),
}));

const mockedLogin = vi.mocked(loginUser);

/** Render the app router starting on the login route. */
function renderAtLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
}

const emailInput = () => screen.getByLabelText('E-Mail');
const passwordInput = () => screen.getByLabelText('Passwort');
// Matches both the idle ("Anmelden") and loading ("Melde an…") labels.
const submitButton = () => screen.getByRole('button', { name: /anmelden|melde an/i });

const fill = () => {
  fireEvent.change(emailInput(), { target: { value: 'member@example.com' } });
  fireEvent.change(passwordInput(), { target: { value: 'correct horse' } });
};

describe('LoginForm', () => {
  beforeEach(() => {
    mockedLogin.mockReset();
  });

  it('renders email + password fields and a submit button', () => {
    renderAtLogin();
    expect(emailInput()).toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
    expect(submitButton()).toBeInTheDocument();
  });

  it('disables submit until both fields are filled', () => {
    renderAtLogin();
    expect(submitButton()).toBeDisabled();

    fireEvent.change(emailInput(), { target: { value: 'member@example.com' } });
    expect(submitButton()).toBeDisabled();

    fireEvent.change(passwordInput(), { target: { value: 'correct horse' } });
    expect(submitButton()).toBeEnabled();
  });

  it('navigates to the start page on success', async () => {
    mockedLogin.mockResolvedValue({ success: true });

    renderAtLogin();
    fill();
    fireEvent.click(submitButton());

    expect(mockedLogin).toHaveBeenCalledWith('member@example.com', 'correct horse');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'drive-together' })).toBeInTheDocument()
    );
  });

  it('shows the backend error and re-enables the button on failure', async () => {
    mockedLogin.mockResolvedValue({ success: false, error: 'E-Mail oder Passwort falsch.' });

    renderAtLogin();
    fill();
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(screen.getByText('E-Mail oder Passwort falsch.')).toBeInTheDocument()
    );
    expect(submitButton()).toBeEnabled();
  });
});
