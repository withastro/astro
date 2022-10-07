import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';
import prefetch from '../dist/index.js';

const test = testFactory({
	root: './fixtures/basic-prefetch/',
	integrations: [
		prefetch({
			selector: 'a[href="/contact"]',
		}),
	],
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
				const requests = [];

				page.on('request', async (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(requests.includes(astro.resolveUrl('/about')), '/about was skipped').toBeFalsy();
				expect(
					requests.includes(astro.resolveUrl('/contact')),
					'/contact was prefetched'
				).toBeTruthy();
				expect(requests.includes(astro.resolveUrl('/admin')), '/admin was skipped').toBeFalsy();
				expect(
					requests.filter((r) => r === astro.resolveUrl('/')).length === 1,
					'/ was skipped by prefetch and only queried once'
				).toBeTruthy();
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
				const requests = [];

				page.on('request', async (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(requests.includes(astro.resolveUrl('/about')), '/about was skipped').toBeFalsy();
				expect(
					requests.includes(astro.resolveUrl('/contact')),
					'/contact was prefetched'
				).toBeTruthy();
				expect(requests.includes(astro.resolveUrl('/admin')), '/admin was skipped').toBeFalsy();
				expect(
					requests.filter((r) => r === astro.resolveUrl('/')).length === 1,
					'/ was skipped by prefetch and only queried once'
				).toBeTruthy();
			});
		});
	});
});
