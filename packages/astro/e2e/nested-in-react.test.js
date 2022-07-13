import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/nested-in-react/' });

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async () => {
	await devServer.stop();
});

test.describe('Nested Frameworks in React', () => {
	test('React counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#react-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('#react-counter-count');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('#react-counter-increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Preact counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#preact-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('#preact-counter-count');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('#preact-counter-increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Solid counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#solid-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('#solid-counter-count');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('#solid-counter-increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Vue counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#vue-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('#vue-counter-count');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('#vue-counter-increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Svelte counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#svelte-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('#svelte-counter-count');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('#svelte-counter-increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});
});
