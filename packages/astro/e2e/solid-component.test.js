import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory(
	{ root: './fixtures/solid-component/' },
	{
		canReplayClicks: true,
	}
);

const config = {
	componentFilePath: './src/components/SolidComponent.jsx',
	counterComponentFilePath: './src/components/Counter.jsx',
};

test.describe('Solid components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('Solid components in MDX files', () => {
	createTests({
		...config,
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
	});
});
