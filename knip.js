// @ts-check
const srcEntry = 'src/**/*.{js,ts,cts}';
const dtsEntry = '*.d.ts';
const testEntry = 'test/**/*.test.{js,ts}';

/** @type {import('knip').KnipConfig} */
export default {
	ignore: ['**/test/**/{fixtures,_temp-fixtures}/**', 'triage/**', '.github/scripts/**'],
	tags: ['-lintignore'],
	ignoreWorkspaces: [
		'examples/**',
		'**/{test,e2e}/**/{fixtures,_temp-fixtures}/**',
		'benchmark/**',
		'packages/language-tools/**/*',
	],
	workspaces: {
		'.': {
			ignoreDependencies: [
				'@astrojs/check', // Used by the build script but not as a standard module import
				'bgproc', // Used by agents, documented in the AGENTS.md file
			],
			// In smoke tests, we checkout to the docs repo so those binaries are not present in this project
			// vsce and ovsx are only used in CI for publishing, and due to how we have to publish the VS Code extension have
			// to be installed in the vscode package, but knip is expecting them to be in the root node_modules
			ignoreBinaries: ['docgen', 'docgen:errors', 'playwright', 'vsce', 'ovsx'],
			entry: ['.flue/agents/*.ts', '.flue/workflows/*/WORKFLOW.ts'],
		},
		'packages/*': {
			entry: [srcEntry, dtsEntry, testEntry],
		},
		'packages/astro': {
			entry: [
				// Can't be detected automatically since it's only in package.json#files
				'templates/**/*',
				srcEntry,
				dtsEntry,
				testEntry,
				'test/types/**/*',
				'e2e/**/*.test.{js,ts}',
				'test/units/teardown.ts',
				// Image services
				'test/test-image-service.ts',
				'test/test-remote-image-service.ts',
				// Can't detect this file when using inside a vite plugin
				'src/vite-plugin-app/createAstroServerApp.ts',
			],
			ignore: [
				'**/e2e/**/{fixtures,_temp-fixtures}/**',
				'performance/**/*',
				// This export is resolved dynamically in packages/astro/src/vite-plugin-app/index.ts
				'src/vite-plugin-app/createExports.ts',
			],
			// Those deps are used in tests but only referenced as strings
			ignoreDependencies: [
				'rehype-autolink-headings',
				'rehype-slug',
				'rehype-toc',
				'remark-code-titles',
				'@types/http-cache-semantics',
			],
		},
		'packages/astro-prism': {
			entry: [srcEntry, dtsEntry, testEntry],
			ignoreUnresolved: ['#prism-loadLanguages'],
		},
		'packages/db': {
			entry: [srcEntry, dtsEntry, testEntry, 'test/types/**/*'],
		},
		'packages/integrations/*': {
			entry: [srcEntry, dtsEntry, testEntry],
		},
		'packages/integrations/cloudflare': {
			entry: [srcEntry, dtsEntry, testEntry],
			// False positive because of cloudflare:workers
			ignoreDependencies: ['cloudflare'],
		},
		'packages/integrations/netlify': {
			entry: [srcEntry, dtsEntry, testEntry],
		},
		'packages/integrations/solid': {
			entry: [srcEntry, dtsEntry, testEntry],
			// It's an optional peer dep (triggers a warning) but it's fine in this case
			ignoreDependencies: ['solid-devtools'],
		},
		'packages/markdown/remark': {
			entry: [srcEntry, dtsEntry, testEntry],
		},
		'packages/upgrade': {
			entry: ['src/index.ts', testEntry],
		},
	},
};
