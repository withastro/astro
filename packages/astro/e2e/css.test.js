import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/css/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('CSS HMR', () => {
	test('edit CSS from @import', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const h = page.locator('h1');
		await expect(h, 'original text set').toHaveText('hello world');

		await astro.editFile('./src/pages/style.css', (original) => original.replace('world', 'astro'));

		await expect(h, 'text changed').toHaveText('hello astro');
	});
});
