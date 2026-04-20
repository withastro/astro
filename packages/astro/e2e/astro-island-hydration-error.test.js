import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, {
	root: './fixtures/astro-island-hydration-error/',
});

test.describe('astro-island hydration error handling', () => {
	let devServer;

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer();
	});

	test.afterAll(async () => {
		await devServer.stop();
	});

	test('recovers hydration after first failed component import', async ({ page, astro }) => {
		const pageUrl = astro.resolveUrl('/');
		const html = await (await page.request.get(pageUrl)).text();
		const componentUrl = getIslandComponentUrl(html);

		let attempts = 0;
		await page.route(`**${componentUrl.split('?')[0]}*`, async (route) => {
			attempts++;
			if (attempts === 1) {
				await route.abort('failed');
				return;
			}
			await route.continue();
		});

		await page.goto(pageUrl);
		const incrementButton = page.locator('#counter .increment');
		const count = page.locator('#counter pre');
		await incrementButton.click();
		await expect(count).toHaveText('1');
		expect(attempts).toBe(2);
	});

	test('dispatches astro:hydration-error and avoids unhandled rejections on persistent failure', async ({
		page,
		astro,
	}) => {
		const pageUrl = astro.resolveUrl('/');
		const html = await (await page.request.get(pageUrl)).text();
		const componentUrl = getIslandComponentUrl(html);

		const pageErrors = [];
		const consoleErrors = [];
		page.on('pageerror', (error) => pageErrors.push(error.message));
		page.on('console', (message) => {
			if (message.type() === 'error') consoleErrors.push(message.text());
		});

		await page.route(`**${componentUrl.split('?')[0]}*`, async (route) => {
			await route.abort('failed');
		});

		await page.goto(pageUrl);
		await page.waitForFunction(() => window.__hydrationErrorEvents?.length === 1);

		const hydrationErrors = await page.evaluate(() => window.__hydrationErrorEvents);
		expect(hydrationErrors).toHaveLength(1);
		expect(hydrationErrors[0].componentUrl).toContain(componentUrl.split('?')[0]);
		expect(pageErrors).toEqual([]);
		expect(
			consoleErrors.some((message) => message.includes('[astro-island] Error hydrating')),
		).toBe(false);
	});
});

function getIslandComponentUrl(html) {
	const match = html.match(/component-url="([^"]+)"/);
	if (!match) {
		throw new Error('Failed to find astro-island component-url in page HTML');
	}
	return match[1];
}
