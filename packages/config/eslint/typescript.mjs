import tseslint from "typescript-eslint";

import base from "./base.mjs";

export default [
  ...base,

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],

    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
    },
  },
];
