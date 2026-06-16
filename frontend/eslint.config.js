import { createEslintConfig } from '../config/eslint.shared.js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default createEslintConfig({
  globals: {
    fetch: 'readonly',
    document: 'readonly',
    window: 'readonly',
  },
  sourceFiles: '{src,tests}/**/*.{ts,tsx}',
  extraConfigs: [
    {
      files: ['src/**/*.{ts,tsx}'],
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
  ],
});
