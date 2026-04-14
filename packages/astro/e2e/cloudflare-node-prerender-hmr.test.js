import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, {
	root: './fixtures/cloudflare-node-prerender-hmr/',
	devToolbar: {
		enabled: false,
	},
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Astro page', () => {
	test('refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const h = page.locator('h1');
		await expect(h, 'original text set').toHaveText('Original content');

		await astro.editFile('./src/pages/index.astro', (original) =>
			original.replaceAll('Original', 'Updated'),
		);

		await expect(h, 'text changed').toHaveText('Updated content');
	});
});
