import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';
import prefetch from "../dist/index.js";

const test = testFactory({
	root: new URL('./fixtures/basic-prefetch/', import.meta.url),
	integrations: [
	  prefetch(),
  ],
});

test.describe('Basic prefetch', () => {
	test.describe('dev', () => {
		test.beforeEach(async ({ astro }) => {
			await astro.startDevServer();
		});

		test.afterEach(async ({ astro }) => {
			await astro.stopDevServer();
		});

		test.describe('prefetches rel="prefetch" links', () => {
			test('skips /admin', async ({ page, astro }) => {
				const requests = [];

				page.on('request', (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(requests.includes(astro.resolveUrl('/about')), '/about was prefetched').toBeTruthy();
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
		test.beforeAll(async ({ astro }) => {
			await astro.build();
			await astro.startPreviewServer();
		});

		// important: close preview server (free up port and connection)
		test.afterAll(async ({ astro }) => {
			await astro.stopPreviewServer();
		});

		test.describe('prefetches rel="prefetch" links', () => {
			test('skips /admin', async ({ page, astro }) => {
				const requests = [];

				page.on('request', (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(requests.includes(astro.resolveUrl('/about')), '/about was prefetched').toBeTruthy();
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
