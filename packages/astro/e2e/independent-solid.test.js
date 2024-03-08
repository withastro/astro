import { sharedIndependentTests } from './utils/shared-independent-tests.js';

const { test, createTests } = sharedIndependentTests(
	{ root: './fixtures/independent-solid/' },
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

// import { expect } from '@playwright/test';
// import { testFactory } from './test-utils.js';

// const test = testFactory({
// 	root: './fixtures/independent-preact-lazy/',
// });

// test.describe('Independent preact', () => {
// 	let previewServer;
// 	const t = test.extend({});

// 	t.beforeAll(async ({ astro }) => {
// 		await astro.build();
// 		previewServer = await astro.preview();
// 		await astro.rmDir('node_modules');
// 	});

// 	t.afterAll(async () => {
// 		await previewServer.stop();
// 	});

// 	t('Only one component in prod', async ({ page, astro }) => {
// 		await page.goto(astro.resolveUrl('/'));

// 		const counter = page.locator('h1');
// 		await expect(counter, 'component is visible').toBeVisible();
// 	});
// });
