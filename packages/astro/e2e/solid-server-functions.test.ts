import { expect } from '@playwright/test';
import { type DevServer, testFactory, waitForHydrate } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/solid-server-functions/' });

let devServer: DevServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Solid server functions', () => {
	test('client island round trip through the endpoint', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/'));

		const demo = page.locator('#sf-demo');
		await expect(demo, 'island is visible').toBeVisible();
		await waitForHydrate(page, demo);

		const value = page.locator('#sf-value');
		await expect(value, 'initial value is 1').toHaveText('1');

		await page.locator('#sf-double').click();
		await expect(value, 'doubled on the server').toHaveText('2');

		await page.locator('#sf-double').click();
		await expect(value, 'doubled again').toHaveText('4');
	});

	test('server functions see Astro middleware locals via the request event', async ({
		astro,
		page,
	}) => {
		await page.goto(astro.resolveUrl('/'));

		// Direct in-process call during island SSR: the renderer's request-event
		// scope carries the page request (middleware ran before the render).
		await expect(page.locator('#sf-ssr-user')).toHaveText('astro-middleware');

		const demo = page.locator('#sf-demo');
		await waitForHydrate(page, demo);

		// Endpoint dispatch: the injected route threads context.locals into the
		// event, and the request passed through Astro's middleware pipeline.
		await page.locator('#sf-whoami').click();
		await expect(page.locator('#sf-user')).toHaveText('astro-middleware');
	});
});
