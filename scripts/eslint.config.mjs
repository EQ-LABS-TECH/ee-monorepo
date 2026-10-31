import shared from '../packages/config/eslint/base.mjs';

// scripts/lib is source here, so omit the shared package's generic build/lib ignores.
const sourceConfig = shared.filter((entry) => !entry.ignores);

export default [
  ...sourceConfig,
  {
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        TextDecoder: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        structuredClone: 'readonly',
      },
    },
  },
];
