module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-shadow': 'error',
    'prefer-const': 'off',
    'prefer-rest-params': 'off',
    'require-jsdoc': 'warn',
  },
};
