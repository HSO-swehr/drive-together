import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export function createEslintConfig(options = {}) {
  const {
    globals = {},
    parserProject = './tsconfig.json',
    // Source AND test files are linted with the same type-aware ruleset. Both
    // are part of each project's tsconfig.json (which the parser uses as its
    // `project`), so there is no second, relaxed config for tests.
    sourceFiles = '{src,tests}/**/*.ts',
    extraConfigs = [],
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

  // Project-specific extra configs (e.g. React plugins for the frontend)
  config.push(...extraConfigs);

  // Build/test config files are not part of the type-aware `project`, so they
  // are linted without type information (syntax + recommended rules only)
  // instead of being ignored entirely.
  config.push(
    {
      files: ['*.config.{ts,js}', 'eslint.config.js'],
      languageOptions: {
        parser,
        globals,
      },
    },
    // prettier last so it can turn off any conflicting stylistic rules
    prettier
  );

  return config;
}
