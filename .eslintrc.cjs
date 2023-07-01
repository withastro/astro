module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./packages/*/tsconfig.json', './tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier', 'no-only-tests'],
  rules: {
    // These off/configured-differently-by-default rules fit well for us
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    'no-only-tests/no-only-tests': 'error',
    '@typescript-eslint/no-shadow': ['error'],
    'no-console': 'warn',

    // Todo: do we want these?
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/class-literal-property-style': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/dot-notation': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-string-starts-ends-with': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/sort-type-constituents': 'off',
    '@typescript-eslint/unbound-method': 'off',

    // These rules enabled by the preset configs don't work well for us
    '@typescript-eslint/await-thenable': 'off',
    'prefer-const': 'off',
  },
  overrides: [
    {
      files: ['packages/**/test/*.js', 'packages/**/*.js'],
      env: {
        mocha: true,
      },
      globals: {
        globalThis: false, // false means read-only
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['packages/integrations/**/*.ts'],
      rules: {
        'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
      },
    },
    {
      files: ['benchmark/**/*.js'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off',
      },
    },
  ],
};
