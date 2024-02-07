import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/dev-toolbar/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Dev Toolbar - Audits', () => {
	test('dev toolbar exists in the page', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const devToolbar = page.locator('astro-dev-toolbar');
		await expect(devToolbar).toHaveCount(1);
	});
});
