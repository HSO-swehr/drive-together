import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import App from '../src/App';
import { getAuthStatus } from '../src/api/auth';

// The API client is mocked so the page is tested in isolation (no real fetch).
vi.mock('../src/api/auth', () => ({
  getAuthStatus: vi.fn(),
}));

const mockedStatus = vi.mocked(getAuthStatus);

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    mockedStatus.mockReset();
  });

  it('shows the auth links when not logged in', async () => {
    mockedStatus.mockResolvedValue(false);
    renderHome();

    expect(await screen.findByRole('link', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrieren' })).toBeInTheDocument();
  });

  it('shows the logged-in view and no auth links when logged in', async () => {
    mockedStatus.mockResolvedValue(true);
    renderHome();

    expect(await screen.findByText(/Du bist angemeldet/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Anmelden' })).not.toBeInTheDocument()
    );
  });
});
