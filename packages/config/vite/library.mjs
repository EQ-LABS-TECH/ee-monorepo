import { mergeConfig } from "vite";

import base from "./base.mjs";

export default mergeConfig(base, {
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },

    sourcemap: true,
  },
});
