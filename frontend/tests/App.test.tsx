import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';

describe('App Component', () => {
  it('should render the app title', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/drive-together/i)).toBeDefined();
    });
  });

  it('should display the health status section', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/API Health Status/i)).toBeDefined();
    });
  });
});
