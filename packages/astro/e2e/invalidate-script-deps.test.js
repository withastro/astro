import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/invalidate-script-deps/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Scripts with dependencies', () => {
	test('refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const h = page.locator('h1');
		await expect(h, 'original text set').toHaveText('before');

		await astro.editFile('./src/scripts/heading.js', (original) =>
			original.replace('before', 'after')
		);

		await expect(h, 'text changed').toHaveText('after');
	});
});
