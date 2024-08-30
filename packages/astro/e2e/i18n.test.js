import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, {
	root: './fixtures/i18n/',
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

test.describe('i18n', () => {
	test('getLocaleByPath', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const p1 = page.locator('p').nth(0);
		await expect(p1).toHaveText('Locale: en');

		const p2 = page.locator('p').nth(1);
		await expect(p2).toHaveText('Locale: fr');

		const p3 = page.locator('p').nth(2);
		await expect(p3).toHaveText('Locale: pt-AO');
	});
});
