import { expect } from '@playwright/test';
import { type DevServer, testFactory, waitForHydrate } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/solid-recurse/' });

let devServer: DevServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Recursive elements with Solid', () => {
	test('Counter', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/'));

		const wrapper = page.locator('#case1');
		await expect(wrapper, 'component is visible').toBeVisible();

		const increment = page.locator('#case1-B');
		await expect(increment, 'initial count is 0').toHaveText('B: 0');

		await waitForHydrate(page, wrapper);

		await increment.click();
		await expect(increment, 'count is incremented').toHaveText('B: 1');
	});
});
