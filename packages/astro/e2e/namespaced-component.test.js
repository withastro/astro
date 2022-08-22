import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/namespaced-component/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Hydrating namespaced components', () => {
	test('Preact Component', async ({ page }) => {
		await page.goto('/');

		const counter = await page.locator('#preact-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const children = await counter.locator('.children');
		await expect(children, 'children exist').toHaveText('preact');

		const increment = await counter.locator('.increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});
});
