// @ts-check
const testEntry = 'test/**/*.test.js';

/** @type {import('knip').KnipConfig} */
export default {
	ignore: ['**/test/**/{fixtures,_temp-fixtures}/**', '.github/scripts/**'],
	tags: ['-lintignore'],
	ignoreWorkspaces: [
		'examples/**',
		'**/{test,e2e}/**/{fixtures,_temp-fixtures}/**',
		'benchmark/**',
	],
	workspaces: {
		'.': {
			ignoreDependencies: [
				'@astrojs/check', // Used by the build script but not as a standard module import
			],
			// In smoke tests, we checkout to the docs repo so those binaries are not present in this project
			ignoreBinaries: ['docgen', 'docgen:errors', 'playwright'],
		},
		'packages/*': {
			entry: [testEntry],
		},
		'packages/astro': {
			entry: [
				// Can't be detected automatically since it's only in package.json#files
				'templates/**/*',
				testEntry,
				'test/types/**/*',
				'e2e/**/*.test.js',
				'test/units/teardown.js',
			],
			ignore: ['**/e2e/**/{fixtures,_temp-fixtures}/**', 'performance/**/*'],
			// Those deps are used in tests but only referenced as strings
			ignoreDependencies: [
				'rehype-autolink-headings',
				'rehype-slug',
				'rehype-toc',
				'remark-code-titles',
				'@types/http-cache-semantics',
			],
		},
		'packages/db': {
			entry: [testEntry, 'test/types/**/*'],
		},
		'packages/integrations/*': {
			entry: [testEntry],
		},
		'packages/integrations/cloudflare': {
			entry: [testEntry],
			// False positive because of cloudflare:workers
			ignoreDependencies: ['cloudflare'],
		},
		'packages/integrations/mdx': {
			entry: [testEntry],
			// Required but not imported directly
			ignoreDependencies: ['@types/*'],
		},
		'packages/integrations/netlify': {
			entry: [testEntry],
			ignore: ['test/hosted/**'],
		},
		'packages/integrations/solid': {
			entry: [testEntry],
			// It's an optional peer dep (triggers a warning) but it's fine in this case
			ignoreDependencies: ['solid-devtools'],
		},
		'packages/integrations/vercel': {
			entry: [testEntry, 'test/test-image-service.js'],
			ignore: ['test/hosted/**'],
		},
		'packages/markdown/remark': {
			entry: [testEntry],
			// package.json#imports are not resolved at the moment
			ignore: ['src/import-plugin-browser.ts'],
		},
		'packages/upgrade': {
			entry: ['src/index.ts', testEntry],
		},
		scripts: {
			// Used in shell script
			ignoreDependencies: ['marked'],
		},
	},
};
