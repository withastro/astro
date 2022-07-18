import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/react-component/' });

test.describe('React components in Astro files', () => {
	createTests({
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
		componentFilePath: './src/components/JSXComponent.jsx',
	});
});

test.describe('React components in Markdown files', () => {
	createTests({
		pageUrl: '/markdown/',
		pageSourceFilePath: './src/pages/markdown.md',
		componentFilePath: './src/components/JSXComponent.jsx',
	});
});

test.describe('React components in MDX files', () => {
	createTests({
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
		componentFilePath: './src/components/JSXComponent.jsx',
	});
});
