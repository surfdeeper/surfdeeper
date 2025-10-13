// ESLint flat config focused on TypeScript files only
// Enforces no explicit any per request
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".astro/**",
      "build/**",
      "public/**",
      "tests/**",
      "scripts/**",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: false,
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
