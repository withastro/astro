import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/preact-component/' });

test.describe('Preact components in Astro files', () => {
	createTests({
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
		componentFilePath: './src/components/JSXComponent.jsx',
	});
});

test.describe('Preact components in Markdown files', () => {
	createTests({
		pageUrl: '/markdown/',
		pageSourceFilePath: './src/pages/markdown.md',
		componentFilePath: './src/components/JSXComponent.jsx',
	});
});
