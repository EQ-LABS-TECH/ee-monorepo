import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import namingConventions from './naming-conventions.mjs';

const namingConfig = {
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
  },
  plugins: { 'eq-labs': { rules: { 'naming-convention': namingConventions } } },
  rules: { 'eq-labs/naming-convention': 'error' },
};

export default [
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  eslint.configs.recommended,
  namingConfig,

  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/lib/**',
      '**/out/**',
      '**/bin/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.tmp/**',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },
];
