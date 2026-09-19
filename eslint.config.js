// Pragmatic flat-config for the new tests/ code only. index.html (the
// legacy single-file game) is intentionally not linted by this config —
// see tests/README.md for why.
export default [
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off',
    },
  },
];
