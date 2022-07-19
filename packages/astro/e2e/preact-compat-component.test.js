import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/preact-compat-component/' });

const config = {
		counterComponentFilePath: './src/components/Counter.jsx',
		componentFilePath: './src/components/JSXComponent.jsx',
}

test.describe('preact/compat components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('preact/compat components in Markdown files', () => {
	createTests({
		...config,
		pageUrl: '/markdown/',
		pageSourceFilePath: './src/pages/markdown.md',
	});
});
