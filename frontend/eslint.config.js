import { createEslintConfig } from '../config/eslint.shared.js';

export default createEslintConfig({
  globals: {
    fetch: 'readonly',
    document: 'readonly',
    window: 'readonly',
  },
  sourceFiles: 'src/**/*.{ts,tsx}',
  testFiles: 'tests/**/*.{ts,tsx}',
});

