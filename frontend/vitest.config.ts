import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import sharedConfig from '../config/vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: [],
      include: ['tests/**/*.test.{ts,tsx}'],
    },
  })
);
