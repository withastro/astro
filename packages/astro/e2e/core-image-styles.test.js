import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, {
	root: '../test/fixtures/core-image-layout/',
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

test.describe('Image styles injection', () => {
	test('injects a style tag with [data-astro-image] CSS', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// Wait for client-side CSS injection
		await page.waitForLoadState('networkidle');

		// Check all style tags for image styles
		const styleTags = await page.locator('style').all();
		let foundImageStyles = false;

		for (const styleTag of styleTags) {
			const content = await styleTag.textContent();
			if (content && content.includes('[data-astro-image]')) {
				foundImageStyles = true;
				break;
			}
		}

		expect(foundImageStyles).toBe(true);
	});
});
