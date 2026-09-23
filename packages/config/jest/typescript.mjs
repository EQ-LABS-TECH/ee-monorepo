import base from "./base.mjs";

export default {
  ...base,

  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],

  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
};
