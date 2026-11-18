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

	test('server components SSR at t=0 and are adopted without endpoint requests', async ({
		astro,
		page,
	}) => {
		const endpointRequests: string[] = [];
		page.on('request', (request) => {
			if (new URL(request.url()).pathname.startsWith('/_server')) {
				endpointRequests.push(request.url());
			}
		});

		await page.goto(astro.resolveUrl('/'));

		// Rendered inline during island SSR through the frames render plugin.
		await expect(page.locator('#sc-name')).toHaveText('panel:alpha');
		await expect(page.locator('#sc-secret')).toHaveText('rendered-on-the-server');

		const demo = page.locator('#sc-demo');
		await waitForHydrate(page, demo);

		// Boot adopted the SSR'd boundary — no endpoint traffic.
		expect(endpointRequests).toHaveLength(0);

		// Client slot state to carry across the morph.
		await page.locator('#sc-draft').fill('draft survives');

		// Re-evaluating the call streams the new panel over the endpoint and
		// morphs the boundary in place.
		await page.locator('#sc-rename').click();
		await expect(page.locator('#sc-name')).toHaveText('panel:beta');
		expect(endpointRequests.length).toBeGreaterThan(0);

		// The client slot kept its DOM identity through the morph.
		await expect(page.locator('#sc-draft')).toHaveValue('draft survives');
	});
});
