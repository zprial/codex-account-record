module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', 'build', 'node_modules'],
  overrides: [
    {
      files: ['app/**/*.{ts,tsx}'],
      env: {
        browser: true,
        es2021: true
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  ]
};
