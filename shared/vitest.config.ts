import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../config/vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: ['tests/**/*.test.ts'],
    },
  })
);
