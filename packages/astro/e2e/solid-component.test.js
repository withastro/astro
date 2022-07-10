import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/solid-component/' });

const config = {
	componentFilePath: './src/components/SolidComponent.jsx',
	counterComponentFilePath: './src/components/Counter.jsx',
	errorReplace: '{ createSignal } from ',
	errorMessage: 'createSignal is not defined',
}

test.describe('Solid components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('Solid components in Markdown files', () => {
	createTests({
		...config,
		pageUrl: '/markdown/',
		pageSourceFilePath: './src/pages/markdown.md',
	});
});

test.describe('Solid components in MDX files', () => {
	createTests({
		...config,
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
	});
});
