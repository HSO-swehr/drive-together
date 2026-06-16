import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// outDir defaults to 'dist'; Vite 8 targets a modern, widely-available browser
// baseline and minifies with esbuild by default — no manual overrides needed.
export default defineConfig({
  plugins: [react()],
});
