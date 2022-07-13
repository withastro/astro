import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/pass-js/' });

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async () => {
	await devServer.stop();
});

test.describe('Passing JS into client components', () => {
	test('Complex nested objects', async ({ astro, page }) => {
		await page.goto('/');

		const nestedDate = await page.locator('#nested-date');
		await expect(nestedDate, 'component is visible').toBeVisible();
		await expect(nestedDate).toHaveText('Thu, 09 Jun 2022 14:18:27 GMT');

		const regeExpType = await page.locator('#regexp-type');
		await expect(regeExpType, 'is visible').toBeVisible();
		await expect(regeExpType).toHaveText('[object RegExp]');

		const regExpValue = await page.locator('#regexp-value');
		await expect(regExpValue, 'is visible').toBeVisible();
		await expect(regExpValue).toHaveText('ok');
	});

	test('BigInts', async ({ page }) => {
		await page.goto('/');

		const bigIntType = await page.locator('#bigint-type');
		await expect(bigIntType, 'is visible').toBeVisible();
		await expect(bigIntType).toHaveText('[object BigInt]');

		const bigIntValue = await page.locator('#bigint-value');
		await expect(bigIntValue, 'is visible').toBeVisible();
		await expect(bigIntValue).toHaveText('11');
	});

	test('Arrays that look like the serialization format', async ({ page }) => {
		await page.goto('/');

		const arrType = await page.locator('#arr-type');
		await expect(arrType, 'is visible').toBeVisible();
		await expect(arrType).toHaveText('[object Array]');

		const arrValue = await page.locator('#arr-value');
		await expect(arrValue, 'is visible').toBeVisible();
		await expect(arrValue).toHaveText('0,foo');
	});
});
