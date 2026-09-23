import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
    emptyOutDir: true,
  },

  server: {
    strictPort: true,
  },

  preview: {
    strictPort: true,
  },
});
