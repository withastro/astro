// eslint-disable-next-line @typescript-eslint/no-var-requires
const { builtinModules } = require('module');

/** @type {import("@types/eslint").Linter.Config} */
module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'prettier',
    'plugin:regexp/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./packages/*/tsconfig.json', './tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'prettier', 'no-only-tests', 'regexp'],
  rules: {
    // These off/configured-differently-by-default rules fit well for us
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
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
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/prefer-string-starts-ends-with': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/sort-type-constituents': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    // Enforce separate type imports for type-only imports to avoid bundling unneeded code
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
        disallowTypeAnnotations: false,
      },
    ],

    // These rules enabled by the preset configs don't work well for us
    '@typescript-eslint/await-thenable': 'off',
    'prefer-const': 'off',

    // In some cases, using explicit letter-casing is more performant than the `i` flag
    'regexp/use-ignore-case': 'off',
  },
  overrides: [
    {
      // Ensure Node builtins aren't included in Astro's server runtime
      files: ['packages/astro/src/runtime/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [...builtinModules],
            patterns: ['node:*'],
          },
        ],
      },
    },
    {
      files: ['packages/astro/src/runtime/client/**/*.ts'],
      env: {
        browser: true,
      },
    },
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
    {
      files: ['packages/db/**/cli/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['packages/astro/src/core/errors/errors-data.ts'],
      rules: {
        // This file is used for docs generation, as such the code need to be in a certain format, we can somewhat ensure this with these rules
        'object-shorthand': ['error', 'methods', { avoidExplicitReturnArrows: true }],
        'arrow-body-style': ['error', 'never'],
      },
    },

    {
      files: ['packages/db/src/runtime/**/*.ts'],
      rules: {
        'no-restricted-imports': 'off',
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../core/*'],
                allowTypeImports: true,
              },
            ],
          },
        ],
      },
    },
  ],
};
