import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: new URL('./fixtures/preact-compat-component/', import.meta.url) });

const config = {
	counterComponentFilePath: './src/components/Counter.jsx',
	componentFilePath: './src/components/JSXComponent.jsx',
};

test.describe('preact/compat components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});
