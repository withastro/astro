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
			const urlObj = new URL(req.url());
			reqUrls.push(urlObj.pathname + urlObj.search);
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

	test('Link with search param should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/?search-param=true');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-search-param').hover(),
		]);
		expect(reqUrls).toContainEqual('/?search-param=true');
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-tap');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-tap');
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-hover');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-hover').hover(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-hover');
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-viewport');
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-viewport');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-viewport"]')).toBeDefined();
	});

	test('manual prefetch() works once', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-manual');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-manual').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-manual');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-manual"]')).toBeDefined();

		// prefetch again should have no effect
		await page.locator('#prefetch-manual').click();
		expect(reqUrls.filter((u) => u.includes('/prefetch-manual')).length).toEqual(1);
	});

	test('data-astro-prefetch="load" should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).toContainEqual('/prefetch-load');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-load"]')).toBeDefined();
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
			const urlObj = new URL(req.url());
			reqUrls.push(urlObj.pathname + urlObj.search);
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
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-default').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-default');
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-false');
	});

	test('Link with search param should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/?search-param=true');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-search-param').hover(),
		]);
		expect(reqUrls).toContainEqual('/?search-param=true');
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-tap');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-tap');
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-hover');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-hover').hover(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-hover');
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-viewport');
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-viewport');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-viewport"]')).toBeDefined();
	});

	test('data-astro-prefetch="load" should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).toContainEqual('/prefetch-load');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-load"]')).toBeDefined();
	});
});

test.describe("Prefetch (prefetchAll: true, defaultStrategy: 'load')", () => {
	let devServer;
	/** @type {string[]} */
	const reqUrls = [];

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				prefetchAll: true,
				defaultStrategy: 'load',
			},
		});
	});

	test.beforeEach(async ({ page }) => {
		page.on('request', (req) => {
			const urlObj = new URL(req.url());
			reqUrls.push(urlObj.pathname + urlObj.search);
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
		expect(reqUrls).toContainEqual('/prefetch-default');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-default"]')).toBeDefined();
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-false');
	});

	test('Link with search param should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/?search-param=true');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-search-param').hover(),
		]);
		expect(reqUrls).toContainEqual('/?search-param=true');
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-tap');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-tap');
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-hover');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-hover').hover(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-hover');
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-viewport');
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-viewport');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-viewport"]')).toBeDefined();
	});

	test('data-astro-prefetch="load" should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).toContainEqual('/prefetch-load');
		expect(page.locator('link[rel="prefetch"][href$="/prefetch-load"]')).toBeDefined();
	});
});
