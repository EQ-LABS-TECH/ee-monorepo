import { mergeConfig } from "vitest/config";

import base from "./base.mjs";

export default mergeConfig(base, {
  test: {
    environment: "jsdom",
  },
});
