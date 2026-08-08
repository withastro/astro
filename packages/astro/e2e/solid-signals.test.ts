import { expect } from '@playwright/test';
import { type DevServer, testFactory, waitForHydrate } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/solid-signals/' });

let devServer: DevServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Solid island signals', () => {
	test('signal hydrates with correct initial value', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#counter');
		await expect(counter, 'counter is visible').toBeVisible();

		const display = page.locator('#display');
		await expect(display, 'display is visible').toBeVisible();

		// SSR renders the initial value
		await expect(counter.locator('pre'), 'counter initial value is 10').toHaveText('10');
		await expect(display.locator('.value'), 'display initial value is 10').toHaveText('10');

		// Wait for both islands to hydrate
		await waitForHydrate(page, counter);
		await waitForHydrate(page, display);

		// Values should still be correct after hydration
		await expect(counter.locator('pre'), 'counter value after hydration is 10').toHaveText('10');
		await expect(display.locator('.value'), 'display value after hydration is 10').toHaveText('10');
	});

	test('shared signal updates across islands', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#counter');
		const display = page.locator('#display');

		await waitForHydrate(page, counter);
		await waitForHydrate(page, display);

		// Click increment in the counter island
		await counter.locator('.increment').click();

		// Both islands should reflect the updated value
		await expect(counter.locator('pre'), 'counter incremented to 11').toHaveText('11');
		await expect(display.locator('.value'), 'display updated to 11').toHaveText('11');

		// Click decrement twice
		await counter.locator('.decrement').click();
		await counter.locator('.decrement').click();

		await expect(counter.locator('pre'), 'counter decremented to 9').toHaveText('9');
		await expect(display.locator('.value'), 'display updated to 9').toHaveText('9');
	});
});
