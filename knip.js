// @ts-check

// Patterns suffixed with `!` are the ones used in production mode (`knip --production`), which only
// analyzes the code we ship. Patterns without the suffix are dev-only: Knip automatically negates
// them in production mode. See https://knip.dev/features/production-mode
const srcEntry = 'src/**/*.{js,ts,cts}!';
const dtsEntry = '*.d.ts!';
const testEntry = 'test/**/*.test.{js,ts}';

// `project` defines the files Knip analyzes, so it is where files are excluded from the analysis
// altogether (`ignore` only suppresses issues in files that are still analyzed).
// See https://knip.dev/guides/configuring-project-files
const project = [
	'**/*!',
	// Fixtures and hosted test apps are standalone projects of their own
	'!**/{test,e2e}/**/{fixtures,_temp-fixtures}/**',
	'!test/hosted/hosted-astro-project/**',
	// Tests are part of the analysis, but never of the production graph
	'!test/**!',
	'!e2e/**!',
];

/** @type {import('knip').KnipConfig} */
export default {
	tags: ['-lintignore'],
	ignoreWorkspaces: [
		'examples/**',
		'**/{test,e2e}/**/{fixtures,_temp-fixtures}/**',
		'benchmark/**',
		'packages/language-tools/**/*',
		// Standalone projects living inside packages
		'packages/astro/performance/**',
		'**/test/hosted/hosted-astro-project/**',
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
			entry: ['.agents/evals/*.ts'],
			// The root workspace ships nothing, so none of its files are part of the production graph
			project: ['**/*', '!triage/**', '!.github/scripts/**'],
		},
		// Internal tooling package: it publishes nothing, so all of its commands are entry points
		scripts: {
			entry: ['*.js!', '{deps,smoke}/*.js!'],
		},
		'packages/*': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
		},
		'packages/astro': {
			entry: [
				// Can't be detected automatically since it's only in package.json#files
				'templates/**/*!',
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
				'src/vite-plugin-app/createAstroServerApp.ts!',
			],
			project,
			ignore: [
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
				// Resolved from the user's project by `astro add cloudflare`.
				'@astrojs/cloudflare',
				// Optional peer dep: dynamically imported in config validation for the legacy
				// remark/rehype pipeline. Knip flags it because it's referenced from source.
				'@astrojs/markdown-remark',
			],
		},
		'packages/astro-prism': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
			ignoreUnresolved: ['#prism-loadLanguages'],
		},
		'packages/integrations/*': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
		},
		'packages/integrations/cloudflare': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
			// False positive because of cloudflare:workers
			ignoreDependencies: ['cloudflare'],
		},
		'packages/integrations/netlify': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
			// Runtime dependency of the Netlify Blobs session driver, which the adapter enables but
			// never imports by name
			ignoreDependencies: ['@netlify/blobs'],
		},
		'packages/integrations/solid': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
			// It's an optional peer dep (triggers a warning) but it's fine in this case
			ignoreDependencies: ['solid-devtools'],
		},
		'packages/integrations/svelte': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
			// Used in testing-library compatibility tests but not directly imported
			ignoreDependencies: ['@testing-library/svelte'],
		},
		'packages/integrations/mdx': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
			// Optional peer dep: dynamically imported for the deprecated remark/rehype options.
			ignoreDependencies: ['@astrojs/markdown-remark'],
		},
		'packages/markdown/remark': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
		},
		'packages/markdown/satteri': {
			entry: [srcEntry, dtsEntry, testEntry],
			project,
			// Only referenced by a `declare module 'hast'` augmentation, which knip doesn't count.
			ignoreDependencies: ['@types/hast'],
		},
		'packages/upgrade': {
			entry: ['src/index.ts!', testEntry],
			project,
		},
	},
};
