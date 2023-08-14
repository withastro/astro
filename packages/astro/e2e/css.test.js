import { expect } from '@playwright/test';
import { getColor, testFactory } from './test-utils.js';

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

test.describe('CSS HMR', () => {
	test('edit CSS from @import', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const h = page.locator('h1');
		expect(await getColor(h)).toBe('rgb(255, 0, 0)');

		await astro.editFile('./src/styles/main.css', (original) =>
			original.replace('--h1-color: red;', '--h1-color: green;')
		);

		expect(await getColor(h)).toBe('rgb(0, 128, 0)');
	});

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
