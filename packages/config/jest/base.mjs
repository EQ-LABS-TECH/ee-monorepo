export default {
  testEnvironment: "node",

  clearMocks: true,
  restoreMocks: true,

  collectCoverageFrom: ["src/**/*.{js,jsx,mjs,cjs}", "!src/**/*.d.ts"],

  coverageDirectory: "coverage",

  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/lib/",
    "/out/",
    "/bin/",
    "/coverage/",
    "/.turbo/",
  ],

  modulePathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/build/",
    "<rootDir>/lib/",
    "<rootDir>/out/",
    "<rootDir>/bin/",
    "<rootDir>/coverage/",
  ],

  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
};
