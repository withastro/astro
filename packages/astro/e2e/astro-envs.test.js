import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/astro-envs/' });

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Astro Environment BASE_URL', () => {
	test('BASE_URL', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/blog/'));

		const astroBaseUrl = page.locator('id=astro-base-url');
		await expect(astroBaseUrl, 'astroBaseUrl equals to /blog').toHaveText('/blog');

		const clientComponentBaseUrl = page.locator('id=client-component-base-url');
		await expect(clientComponentBaseUrl, 'clientComponentBaseUrl equals to /blog').toHaveText(
			'/blog'
		);
	});
});
