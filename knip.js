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
			ignoreDependencies: ['@astrojs/check'],
			ignoreBinaries: ['docgen', 'docgen:errors', 'playwright'],
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
			ignoreDependencies: [
				'rehype-autolink-headings',
				'rehype-slug',
				'rehype-toc',
				'remark-code-titles',
			],
		},
		'packages/astro-prism': {},
		'packages/astro-rss': {
			entry: [testEntry],
		},
		'packages/create-astro': {
			entry: [testEntry],
		},
		'packages/db': {
			entry: [testEntry],
		},
		'packages/integrations/cloudflare': {
			entry: [testEntry],
			// False positive because of cloudflare:workers
			ignoreDependencies: ['cloudflare'],
		},
		'packages/integrations/markdoc': {
			entry: [testEntry],
		},
		'packages/integrations/mdx': {
			entry: [testEntry],
			ignoreDependencies: ['@types/*'],
		},
		'packages/integrations/netlify': {
			entry: [testEntry],
			ignore: ['test/hosted/**'],
		},
		'packages/integrations/node': {
			entry: [testEntry],
		},
		'packages/integrations/partytown': {},
		'packages/integrations/preact': {},
		'packages/integrations/react': {
			entry: [testEntry],
		},
		'packages/integrations/sitemap': {
			entry: [testEntry],
		},
		'packages/integrations/solid': {
			entry: [testEntry],
			ignoreDependencies: ['solid-devtools'],
		},
		'packages/integrations/svelte': {},
		'packages/integrations/vercel': {
			entry: [testEntry, 'test/test-image-service.js'],
			ignore: ['test/hosted/**'],
		},
		'packages/integrations/vue': {
			entry: [testEntry],
		},
		'packages/integrations/web-vitals': {
			entry: [testEntry],
		},
		'packages/internal-helpers': {},
		'packages/markdown/remark': {
			entry: [testEntry],
			// package.json#imports are not resolved
			ignore: ['src/import-plugin-browser.ts'],
		},
		'packages/studio': {},
		'packages/telemetry': {
			entry: [testEntry],
		},
		'packages/underscore-redirects': {
			entry: [testEntry],
		},
		'packages/upgrade': {
			entry: ['src/index.ts', testEntry],
		},
	},
};
