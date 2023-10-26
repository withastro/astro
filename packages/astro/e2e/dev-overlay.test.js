import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/dev-overlay/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Dev Overlay zzz', () => {
	test('dev overlay exists in the page', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const h = page.locator('astro-dev-overlay');
		await expect(h).toHaveCount(1);
	});

	test('can open Astro plugin', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-overlay');
		const h = overlay.locator('button[data-plugin-id="astro"]');
		await h.click();

		const astroPluginCanvas = overlay.locator(
			'astro-overlay-plugin-canvas[data-plugin-id="astro"]'
		);
		const astroWindow = astroPluginCanvas.locator('astro-overlay-window');
		await expect(astroWindow).toHaveCount(1);
		await expect(astroWindow).toBeVisible();
	});

	
});
