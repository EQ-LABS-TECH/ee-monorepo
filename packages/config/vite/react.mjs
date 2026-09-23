import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";

import base from "./base.mjs";

export default mergeConfig(base, {
  plugins: [react()],
});
