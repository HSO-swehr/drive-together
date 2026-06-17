import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// outDir defaults to 'dist'; Vite 8 targets a modern, widely-available browser
// baseline and minifies with esbuild by default — no manual overrides needed.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the `shared` workspace from its TypeScript source so the frontend
    // (incl. HMR via the backend's Vite middleware) needs no separate build of
    // shared. Type resolution uses the same source via shared's exports map.
    alias: {
      shared: path.resolve(import.meta.dirname, '../shared/src/index.ts'),
    },
  },
});
