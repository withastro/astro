// @ts-check

/** @typedef {import('knip').KnipConfig} KnipConfig */

const testEntry = 'test/**/*.test.js';

/** @type {KnipConfig} */
export default {
	ignore: ['**/test/**/{fixtures,_temp-fixtures}/**'],
	tags: ['-lintignore'],
	workspaces: {
		'packages/astro': {
			entry: [
				// Can't be detected automatically since it's only in package.json#files
				'templates/**/*',
				testEntry,
				'test/types/**/*',
				'e2e/**/*.test.js',
			],
			ignore: ['**/e2e/**/{fixtures,_temp-fixtures}/**', 'performance/**/*'],
			ignoreDependencies: [
				'mdast-util-mdx',
				'rehype-autolink-headings',
				'rehype-slug',
				'rehype-toc',
				'remark-code-titles',
			],
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
		},
		'packages/integrations/svelte': {},
		'packages/integrations/vercel': {
			entry: [testEntry],
			ignore: ['test/hosted/**'],
		},
		'packages/integrations/vue': {
			entry: [testEntry],
		},
		'packages/integrations/web-vitals': {
			entry: [testEntry],
		},
	},
};
