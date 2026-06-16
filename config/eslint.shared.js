import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export function createEslintConfig(options = {}) {
  const {
    globals = {},
    parserProject = './tsconfig.json',
    sourceFiles = '**/*.ts',
    testFiles = null,
  } = options;

  const config = [
    {
      ignores: ['dist/**', 'node_modules/**'],
    },
    eslint.configs.recommended,
    {
      files: [sourceFiles],
      languageOptions: {
        parser: parser,
        parserOptions: {
          project: parserProject,
        },
        globals,
      },
      plugins: {
        '@typescript-eslint': tseslint,
      },
      rules: {
        ...tseslint.configs.recommended.rules,
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    },
  ];

  // Add test-specific config if provided
  if (testFiles) {
    config.push({
      files: [testFiles],
      languageOptions: {
        parser: parser,
        globals,
      },
      plugins: {
        '@typescript-eslint': tseslint,
      },
      rules: {
        ...tseslint.configs.recommended.rules,
      },
    });
  }

  // Add ignore patterns and prettier
  config.push(
    {
      ignores: ['*.config.ts', '*.config.js', 'eslint.config.js'],
    },
    prettier
  );

  return config;
}
