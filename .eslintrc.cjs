/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: [
    'simple-import-sort',
    'react-refresh',
    // Enforce extensions in import statements to support ESM:
    //  - https://www.npmjs.com/package/eslint-plugin-require-extensions
    //  - https://stackoverflow.com/a/72491599
    'require-extensions',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:require-extensions/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:react/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'react/react-in-jsx-scope': 'off',
  },
};
