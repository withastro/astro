import { expect } from '@playwright/test';
import { isWindows, testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/css/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('CSS Sourcemap HMR', () => {
	test.skip(isWindows, 'TODO: fix css hmr in windows');

	test('removes Astro-injected CSS once Vite-injected CSS loads', async ({ page, astro }) => {
		const html = await astro.fetch('/').then((res) => res.text());

		// style[data-astro-dev-id] should exist in initial SSR'd markup
		expect(html).toMatch('data-astro-dev-id');

		await page.goto(astro.resolveUrl('/'));

		// Ensure JS has initialized
		await page.waitForTimeout(500);

		// style[data-astro-dev-id] should NOT exist once JS runs
		expect(await page.locator('style[data-astro-dev-id]').count()).toEqual(0);

		// style[data-vite-dev-id] should exist now
		expect(await page.locator('style[data-vite-dev-id]').count()).toBeGreaterThan(0);
	});
});
