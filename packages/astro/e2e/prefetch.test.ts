import { type Page, expect } from '@playwright/test';
import { type DevServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, {
	root: './fixtures/prefetch/',
});

// Used to track fetch request urls
const reqUrls: string[] = [];
test.beforeEach(async ({ page }) => {
	page.on('request', (req) => {
		const urlObj = new URL(req.url());
		reqUrls.push(urlObj.pathname + urlObj.search);
	});
});
test.afterEach(() => {
	reqUrls.length = 0;
});

/**
 * Check if url is prefetched via `link[rel="prefetch"]` or `fetch()` (from `reqUrls`)
 * @param count Also expect that it's prefetched this amount of times
 */
async function expectUrlPrefetched(url: string, page: Page, count?: number) {
	try {
		await expect(page.locator(`link[rel="prefetch"][href$="${url}"]`)).toBeAttached();
	} catch {
		// If link is not found, check if it was fetched via `fetch()`
		expect(reqUrls, `${url} is not prefetched via link or fetch`).toContainEqual(url);
	}

	if (count != null) {
		const linkCount = await page.locator(`link[rel="prefetch"][href$="${url}"]`).count();
		try {
			expect(linkCount).toBe(count);
		} catch {
			const fetchCount = reqUrls.filter((u) => u.includes(url)).length;
			expect(
				fetchCount,
				`${url} should be prefetched ${count} time(s), but is prefetch with link ${linkCount} time(s) and with fetch ${fetchCount} time(s)`,
			).toEqual(count);
		}
	}
}

/**
 * Check if url is not prefetched via `link[rel="prefetch"]` and `fetch()` (from `reqUrls`)
 */
async function expectUrlNotPrefetched(url: string, page: Page) {
	await expect(page.locator(`link[rel="prefetch"][href$="${url}"]`)).not.toBeAttached();
	expect(reqUrls).not.toContainEqual(url);
}

async function mouseDown(page: Page, selector: string) {
	const box = (await page.locator(selector).boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
}

async function waitForPageLoad(page: Page) {
	await page.waitForEvent('response');
	await new Promise((res) => setTimeout(res, 500)); // wait for transition to finish
}

test.describe('Prefetch (default)', () => {
	let devServer: DevServer;

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer();
	});

	test.afterAll(async () => {
		await devServer.stop();
	});

	test('Link without data-astro-prefetch should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-default', page);
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-false', page);
	});

	test('Link with search param should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/?search-param=true', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-search-param').hover(),
		]);
		await expectUrlPrefetched('/?search-param=true', page);
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

	test('data-astro-prefetch="tap" should prefetch on tap when clicking a nested child element', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		expect(reqUrls).not.toContainEqual('/prefetch-tap-nested');
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap-nested span').click(),
		]);
		expect(reqUrls).toContainEqual('/prefetch-tap-nested');
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-hover', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-hover').hover(),
		]);
		await expectUrlPrefetched('/prefetch-hover', page);
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-viewport', page);
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		await expectUrlPrefetched('/prefetch-viewport', page);
	});

	test('manual prefetch() works once', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-manual', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-manual').click(),
		]);
		await expectUrlPrefetched('/prefetch-manual', page);

		// prefetch again should have no effect
		await page.locator('#prefetch-manual').click();
		await expectUrlPrefetched('/prefetch-manual', page, 1);
	});

	test('data-astro-prefetch="load" should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlPrefetched('/prefetch-load', page);
	});
});

test.describe("Prefetch (prefetchAll: true, defaultStrategy: 'tap')", () => {
	let devServer: DevServer;

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				prefetchAll: true,
				defaultStrategy: 'tap',
			},
		});
	});

	test.afterAll(async () => {
		await devServer.stop();
	});

	test('Link without data-astro-prefetch should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-default', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-default').click(),
		]);
		await expectUrlPrefetched('/prefetch-default', page);
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-false', page);
	});

	test('Link with search param should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/?search-param=true', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-search-param').hover(),
		]);
		await expectUrlPrefetched('/?search-param=true', page);
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-tap', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap').click(),
		]);
		await expectUrlPrefetched('/prefetch-tap', page);
	});

	test('data-astro-prefetch="tap" should prefetch on tap when clicking a nested child element', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-tap-nested', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap-nested span').click(),
		]);
		await expectUrlPrefetched('/prefetch-tap-nested', page);
	});

	test('link without data-astro-prefetch should prefetch on tap when clicking a nested child element', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-default-nested', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-default-nested span').click(),
		]);
		await expectUrlPrefetched('/prefetch-default-nested', page);
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-hover', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-hover').hover(),
		]);
		await expectUrlPrefetched('/prefetch-hover', page);
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-viewport', page);
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		await expectUrlPrefetched('/prefetch-viewport', page);
	});

	test('data-astro-prefetch="load" should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlPrefetched('/prefetch-load', page);
	});
});

test.describe("Prefetch (prefetchAll: true, defaultStrategy: 'load')", () => {
	let devServer: DevServer;

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				prefetchAll: true,
				defaultStrategy: 'load',
			},
		});
	});

	test.afterAll(async () => {
		await devServer.stop();
	});

	test('Link without data-astro-prefetch should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlPrefetched('/prefetch-default', page);
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-false', page);
	});

	test('Link with search param should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/?search-param=true', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-search-param').hover(),
		]);
		await expectUrlPrefetched('/?search-param=true', page);
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-tap', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap').click(),
		]);
		await expectUrlPrefetched('/prefetch-tap', page);
	});

	test('data-astro-prefetch="tap" should prefetch on tap when clicking a nested child element', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-tap-nested', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-tap-nested span').click(),
		]);
		await expectUrlPrefetched('/prefetch-tap-nested', page);
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-hover', page);
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-hover').hover(),
		]);
		await expectUrlPrefetched('/prefetch-hover', page);
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlNotPrefetched('/prefetch-viewport', page);
		// Scroll down to show the element
		await Promise.all([
			page.waitForEvent('request'), // wait prefetch request
			page.locator('#prefetch-viewport').scrollIntoViewIfNeeded(),
		]);
		await expectUrlPrefetched('/prefetch-viewport', page);
	});

	test('data-astro-prefetch="load" should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expectUrlPrefetched('/prefetch-load', page);
	});
});

// Playwrights `request` event does not appear to fire when using the speculation rules API
// Instead of checking for the added url, each test checks to see if `document.head`
// contains a `script[type=speculationrules]` that has the `url` in it.
test.describe('Prefetch (default), Experimental ({ clientPrerender: true })', () => {
	/**
	 * @returns the number of script[type=speculationrules] that have the url
	 */
	async function scriptIsInHead(page: Page, url: string) {
		return await page.evaluate((testUrl) => {
			const scripts = document.head.querySelectorAll('script[type="speculationrules"]');
			let count = 0;
			for (const script of scripts) {
				const speculationRules: { prerender: { urls: string[] }[] } = JSON.parse(
					script.textContent!,
				);
				const specUrl = speculationRules.prerender.at(0)!.urls.at(0)!;
				const indexOf = specUrl.indexOf(testUrl);
				if (indexOf > -1) count++;
			}
			return count;
		}, url);
	}

	let devServer: DevServer;

	test.beforeAll(async ({ astro, browserName }) => {
		test.skip(browserName !== 'chromium', 'Only Chromium supports clientPrerender');

		devServer = await astro.startDevServer({
			experimental: {
				clientPrerender: true,
			},
		});
	});

	test.afterAll(async () => {
		await devServer?.stop();
	});

	test('Link without data-astro-prefetch should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '/prefetch-default')).toBeFalsy();
	});

	test('data-astro-prefetch="false" should not prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '/prefetch-false')).toBeFalsy();
	});

	test('Link with search param should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '?search-param=true')).toBeFalsy();
		await page.locator('#prefetch-search-param').hover();
		await page.waitForFunction(
			() => document.querySelectorAll('script[type=speculationrules]').length === 2,
		);
		expect(await scriptIsInHead(page, '?search-param=true')).toBeTruthy();
	});

	test('data-astro-prefetch="tap" should prefetch on tap', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '/prefetch-tap')).toBeFalsy();
		await page.locator('#prefetch-tap').dragTo(page.locator('#prefetch-hover'));
		expect(await scriptIsInHead(page, '/prefetch-tap')).toBeTruthy();
	});

	test('data-astro-prefetch="tap" should prefetch on tap when clicking a nested child element', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '/prefetch-tap-nested')).toBeFalsy();
		await page.locator('#prefetch-tap-nested span').dragTo(page.locator('#prefetch-hover'));
		expect(await scriptIsInHead(page, '/prefetch-tap-nested')).toBeTruthy();
	});

	test('data-astro-prefetch="hover" should prefetch on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '/prefetch-hover')).toBeFalsy();
		await page.locator('#prefetch-hover').hover();
		await page.waitForFunction(
			() => document.querySelectorAll('script[type=speculationrules]').length === 2,
		);
		expect(await scriptIsInHead(page, '/prefetch-hover')).toBeTruthy();
	});

	test('data-astro-prefetch="viewport" should prefetch on viewport', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '/prefetch-viewport')).toBeFalsy();
		// Scroll down to show the element
		await page.locator('#prefetch-viewport').scrollIntoViewIfNeeded();
		await page.waitForFunction(
			() => document.querySelectorAll('script[type=speculationrules]').length === 2,
		);
		expect(await scriptIsInHead(page, '/prefetch-viewport')).toBeTruthy();
	});

	test('manual prefetch() works once', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, '/prefetch-manual')).toEqual(0);
		await page.locator('#prefetch-manual').click();
		expect(await scriptIsInHead(page, '/prefetch-manual')).toEqual(1);

		// prefetch again should have no effect
		await page.locator('#prefetch-manual').click();
		expect(await scriptIsInHead(page, '/prefetch-manual')).toEqual(1);
	});

	test('data-astro-prefetch="load" should prefetch', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		expect(await scriptIsInHead(page, 'prefetch-load')).toBeTruthy();
	});
});

test.describe('Prefetch View Transitions', () => {
	let devServer: DevServer;

	test.afterEach(async () => {
		await devServer.stop();
	});

	test('"load" strategy', async ({ page, astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				defaultStrategy: 'load',
			},
		});
		await page.goto(astro.resolveUrl('/view-transitions'));
		await expectUrlPrefetched('/view-transitions/1', page);

		await Promise.all([waitForPageLoad(page), page.click('a')]);
		await expectUrlPrefetched('/view-transitions/2', page);
	});

	test('"viewport" strategy', async ({ page, astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				defaultStrategy: 'viewport',
			},
		});
		await page.goto(astro.resolveUrl('/view-transitions'));
		await expectUrlPrefetched('/view-transitions/1', page);

		await Promise.all([waitForPageLoad(page), page.click('a')]);
		await expectUrlPrefetched('/view-transitions/2', page);
	});

	test('"tap" strategy', async ({ page, astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				defaultStrategy: 'tap',
			},
		});
		await page.goto(astro.resolveUrl('/view-transitions'));

		await expectUrlNotPrefetched('/view-transitions/1', page);
		await mouseDown(page, 'a');
		await expectUrlPrefetched('/view-transitions/1', page);

		await Promise.all([waitForPageLoad(page), page.mouse.up()]);

		await expectUrlNotPrefetched('/view-transitions/2', page);
		await mouseDown(page, 'a');
		await expectUrlPrefetched('/view-transitions/2', page);
	});

	test('"hover" strategy', async ({ page, astro }) => {
		devServer = await astro.startDevServer({
			prefetch: {
				defaultStrategy: 'hover',
			},
		});
		await page.goto(astro.resolveUrl('/view-transitions'));

		await expectUrlNotPrefetched('/view-transitions/1', page);
		await page.locator('a').hover();
		await expectUrlPrefetched('/view-transitions/1', page);

		await Promise.all([waitForPageLoad(page), page.click('a')]);

		await expectUrlNotPrefetched('/view-transitions/2', page);
		await page.locator('a').hover();
		await expectUrlPrefetched('/view-transitions/2', page);
	});
});
