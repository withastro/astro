import { expect } from '@playwright/test';
import testAdapter from '../test/test-adapter.js';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: '../tests/fixtures/custom-500/',
});

test.describe.skip('custom 500 - preview', () => {
	let previewServer;

	test.beforeAll(async ({ astro }) => {
		await astro.build({
			output: "server",
			adapter: testAdapter(),
		});
		previewServer = await astro.preview();
	});

	test.afterAll(async () => {
		await previewServer.stop();
	});

	test.skip('renders custom 500', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/'));

		await expect(page.locator('h1')).toHaveText('Server error');
		await expect(page.locator('p')).toHaveText('some error');
	});
});
