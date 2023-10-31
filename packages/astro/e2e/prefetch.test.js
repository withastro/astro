import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/prefetch/',
});

test.describe('Prefetch (default)', () => {
	let devServer;
	/** @type {string[]} */
	const reqUrls = [];

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer();
	});

	test.beforeEach(async ({ page }) => {
		page.on('request', (req) => {
			reqUrls.push(new URL(req.url()).pathname);
		});
	});

	test.afterEach(() => {
		reqUrls.length = 0;
	});

	test.afterAll(async () => {
		await devServer.stop();
	});

	test('Link without data-astro-prefetch should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-default');
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-false');
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-tap');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch debug log after next action
			page.locator('#prefetch-tap').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-tap');
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-hover');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch debug log after next action
			page.locator('#prefetch-hover').hover(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-hover');
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-viewport');
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch debug log after next action
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-viewport');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-viewport"]')).toBeDefined();
	});
});

test.describe("Prefetch (prefetchAll: true, defaultStrategy: 'tap')", () => {
	let devServer;
	/** @type {string[]} */
	const reqUrls = [];

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				prefetchAll: true,
				defaultStrategy: 'tap',
			},
		});
	});

	test.beforeEach(async ({ page }) => {
		page.on('request', (req) => {
			reqUrls.push(new URL(req.url()).pathname);
		});
	});

	test.afterEach(() => {
		reqUrls.length = 0;
	});

	test.afterAll(async () => {
		await devServer.stop();
	});

	test('Link without data-astro-prefetch should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-default');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch debug log after next action
			page.locator('#prefetch-default').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-default');
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-false');
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-tap');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch debug log after next action
			page.locator('#prefetch-tap').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-tap');
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-hover');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch debug log after next action
			page.locator('#prefetch-hover').hover(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-hover');
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-viewport');
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch debug log after next action
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-viewport');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-viewport"]')).toBeDefined();
	});
});
