import { createEslintConfig } from '../config/eslint.shared.js';

export default createEslintConfig({
  globals: {
    process: 'readonly',
    console: 'readonly',
  },
  sourceFiles: 'src/**/*.ts',
});

