import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtinModules } from 'node:module';

import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

// plugins
import prettierEslint from 'eslint-plugin-prettier';
import noOnlyTestsEslint from 'eslint-plugin-no-only-tests';
import regexpEslint from 'eslint-plugin-regexp';
const typescriptEslint = tseslint.plugin;

// parsers
const typescriptParser = tseslint.parser;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ref: https://eslint.org/docs/latest/use/configure/migration-guide#using-eslintrc-configs-in-flat-config
// mimic CommonJS variables -- not needed if using CommonJS
const compat = new FlatCompat({
	baseDirectory: __dirname,
});

export default [
	// If ignores is used without any other keys in the configuration object, then the patterns act as global ignores.
	// ref: https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
	{
		ignores: [
			'**/.*',
			'**/*.d.ts',
			'packages/**/*.min.js',
			'packages/**/dist/',
			'packages/**/fixtures/',
			'packages/astro/vendor/vite/',
			'benchmark/**/dist/',
			'examples/',
			'scripts/',
			'.github/',
			'.changeset/',
		],
	},

	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	// mimic ESLintRC-style extends
	...compat.extends('prettier'),
	...compat.extends('plugin:regexp/recommended'),
	{
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				project: ['./packages/*/tsconfig.json', './tsconfig.eslint.json'],
				tsconfigRootDir: __dirname,
			},
		},
		plugins: {
			'@typescript-eslint': typescriptEslint,
			prettier: prettierEslint,
			'no-only-tests': noOnlyTestsEslint,
			regexp: regexpEslint,
		},
		rules: {
			// These off/configured-differently-by-default rules fit well for us
			'@typescript-eslint/switch-exhaustiveness-check': 'error',
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
			'@typescript-eslint/no-shadow': 'error',
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
			'@typescript-eslint/no-unnecessary-type-assertion': 'off',
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
	},

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
		languageOptions: {
			globals: {
				browser: true,
			},
		},
	},
	{
		files: ['packages/**/test/*.js', 'packages/**/*.js'],
		languageOptions: {
			globals: {
				mocha: true,
				globalThis: false, // false means read-only
			},
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
];
