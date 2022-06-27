import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';
import prefetch from '../dist/index.js';

const test = testFactory({
	root: './fixtures/basic-prefetch/',
	integrations: [
		prefetch({
			selector: 'a[href="/contact"]'
		}),
	]
});

test.describe('Custom prefetch selectors', () => {
	test.describe('dev', () => {
		let devServer;

		test.beforeEach(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		test.afterEach(async () => {
			await devServer.stop();
		});

		test.describe('prefetches links by custom selector', () => {
			test('only prefetches /contact', async ({ page, astro }) => {
				const requests = new Set();

				page.on('request', async (request) => requests.add(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				await expect(requests.has(astro.resolveUrl('/about')), '/about was skipped').toBeFalsy();
				await expect(requests.has(astro.resolveUrl('/contact')), '/contact was prefetched').toBeTruthy();
				await expect(requests.has(astro.resolveUrl('/admin')), '/admin was skipped').toBeFalsy();
			});
		});
	});

	test.describe('build', () => {
		let previewServer;

		test.beforeAll(async ({ astro }) => {
			await astro.build();
			previewServer = await astro.preview();
		});

		// important: close preview server (free up port and connection)
		test.afterAll(async () => {
			await previewServer.stop();
		});

		test.describe('prefetches links by custom selector', () => {
			test('only prefetches /contact', async ({ page, astro }) => {
				const requests = new Set();

				page.on('request', async (request) => requests.add(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				await expect(requests.has(astro.resolveUrl('/about')), '/about was skipped').toBeFalsy();
				await expect(requests.has(astro.resolveUrl('/contact')), '/contact was prefetched').toBeTruthy();
				await expect(requests.has(astro.resolveUrl('/admin')), '/admin was skipped').toBeFalsy();
			});
		});
	});
});
