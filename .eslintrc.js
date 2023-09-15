module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.js'],
  // parser: '@typescript-eslint/parser',
  rules: {
    // custom
    quotes: ['warn', 'single'],
    indent: ['warn', 2],
    semi: 1,
  },
}
