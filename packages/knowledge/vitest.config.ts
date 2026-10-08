import baseConfig from '@eq-labs/config-vitest/base.mjs';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      // package-local includes already covered by base; keep explicit if needed
      include: ['src/**/*.{test,spec}.ts'],
    },
  }),
);
