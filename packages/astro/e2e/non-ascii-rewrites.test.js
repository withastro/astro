import { expect } from '@playwright/test';
import { testFactory, waitForHydrate } from './test-utils.js';

const test = testFactory(import.meta.url, { root: './fixtures/non-ascii-rewrites/' });

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Non-ASCII Rewrites', () => {
	const testRedirectTo = (url, nestedParamValue) =>
		test(url, async ({ page, astro, browserName }) => {
			await page.goto(astro.resolveUrl(url));
			await expect(page.locator('body')).toHaveText(`Got nested = ${nestedParamValue}`);
		});

	testRedirectTo('/héllo', 'héllo');
	testRedirectTo('/redirected/héllo', 'héllo');
	testRedirectTo('/hello', 'hello');
	testRedirectTo('/redirected/hello', 'hello');
	testRedirectTo('/accented_hello', 'héllo');
	testRedirectTo('/ascii_héllo', 'hello');
});
