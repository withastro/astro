import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/svelte-component/' });

const config = {
	componentFilePath: './src/components/SvelteComponent.svelte',
	counterComponentFilePath: './src/components/Counter.svelte',
	counterCssFilePath: './src/components/Counter.svelte',
};

test.describe('Svelte components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('Svelte components in Markdown files', () => {
	createTests({
		...config,
		pageUrl: '/markdown/',
		pageSourceFilePath: './src/pages/markdown.md',
	});
});

test.describe('Svelte components in MDX files', () => {
	createTests({
		...config,
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
	});
});
