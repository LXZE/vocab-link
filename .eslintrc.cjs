module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  plugins: ['vitest-globals'],
  extends: [
    'eslint:recommended',
    'plugin:svelte/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    extraFileExtensions: ['.svelte'] // This is a required setting in `@typescript-eslint/parser` v4.24.0.
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      parser: 'svelte-eslint-parser',
      // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    {
      files: ["**/tests/**/*.test.{j,t}s?(x)",],
      env: {
        'vitest-globals/env': true,
      }
    }
  ],
  rules: {
    // custom
    quotes: ['warn', 'single'],
    indent: ['warn', 2],
    semi: 1,
    'no-redeclare': 0,
    "no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
  },
}
