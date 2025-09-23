module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'airbnb-base',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    'import/extensions': ['error', 'ignorePackages', { ts: 'never' }],
    'import/no-unresolved': 'off',
    'class-methods-use-this': 'off',
    'no-console': 'warn',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};