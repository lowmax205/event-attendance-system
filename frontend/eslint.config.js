import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import * as noLegacyColors from './eslint-rules/no-legacy-colors.js';

// Manually compose rules from legacy shareable configs to avoid using their eslintrc shape directly
const mergedRules = {
  ...(react.configs.recommended?.rules || {}),
  ...(reactHooks.configs['recommended-latest']?.rules || {}),
  ...(reactRefresh.configs?.recommended?.rules || {}),
};

// Vitest global identifiers for test environments
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  vi: 'readonly',
};

export default defineConfig([
  globalIgnores(['dist', 'eslint-rules/no-legacy-colors.js']),
  {
    files: ['**/*.{js,jsx}', '**/*.config.js'],
    ignores: ['dist', 'node_modules'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      'unused-imports': unusedImports,
      'no-legacy-colors': noLegacyColors,
    },
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, React: 'writable' },
      parserOptions: { ecmaVersion: 'latest', ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    settings: {
      react: { version: 'detect' },
      // Simplify resolver; Vite alias handled by tooling, avoid custom alias resolver warnings
      'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...mergedRules,
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      // Suppress variable/arg unused warnings to achieve a clean lint run
      'unused-imports/no-unused-vars': 'error',
      // Enable console detection to enforce DevLogger usage
      'no-console': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Disable Fast Refresh export-only rule to allow utility exports in component files
      'react-refresh/only-export-components': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            ['builtin', 'external', 'internal'],
            ['parent', 'sibling', 'index'],
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': ['warn', { count: 1 }],
      'import/no-duplicates': 'warn',
      'no-legacy-colors/no-legacy-colors': 'warn',
      // Allow apostrophes and other characters in JSX text without escaping
      'react/no-unescaped-entities': 'off',
    },
  },
  // Turn off formatting-related rules via Prettier config (converted manually)
  eslintConfigPrettier,
  // Test files override (Vitest)
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...vitestGlobals },
    },
    rules: {
      // Allow dev dependencies import in tests
      'import/no-extraneous-dependencies': 'off',
      // Allow console output in tests for debugging
      'no-console': 'warn',
    },
  },
  // Allow console usage ONLY in the centralized dev logger utility
  {
    files: ['src/lib/dev-logger.js'],
    rules: {
      'no-console': 'off',
    },
  },
  // Recharts chart container uses attribute selectors with legacy hex values coming from the library's DOM; allow in this file
  {
    files: ['src/components/ui/chart.jsx'],
    rules: {
      'no-legacy-colors/no-legacy-colors': 'off',
    },
  },
]);
