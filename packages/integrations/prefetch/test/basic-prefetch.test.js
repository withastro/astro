import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/basic-prefetch/' });

test.describe('Basic prefetch', () => {
	test.describe('dev', () => {
		let devServer;

		test.beforeEach(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		test.afterEach(async () => {
			await devServer.stop();
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

		test.describe('prefetches rel="prefetch-intent" links only on hover', () => {
			test('prefetches /uses on hover', async ({ page, astro }) => {
				const requests = [];

				page.on('request', (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(
					requests.includes(astro.resolveUrl('/uses')),
					'/uses was not prefetched'
				).toBeFalsy();

				await page.hover('a[href="/uses"]');

				await page.waitForLoadState('networkidle');

				expect(
					requests.includes(astro.resolveUrl('/uses')),
					'/uses was prefetched on hover'
				).toBeTruthy();
			});
		});
	});

	test.describe('build', () => {
		let previewServer;

		test.beforeEach(async ({ astro }) => {
			await astro.build();
			previewServer = await astro.preview();
		});

		// important: close preview server (free up port and connection)
		test.afterEach(async () => {
			await previewServer.stop();
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

		test.describe('prefetches rel="prefetch-intent" links only on hover', () => {
			test('prefetches /uses on hover', async ({ page, astro }) => {
				const requests = [];

				page.on('request', (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				expect(
					requests.includes(astro.resolveUrl('/uses')),
					'/uses was not prefetched'
				).toBeFalsy();

				await page.hover('a[href="/uses"]');

				await page.waitForLoadState('networkidle');

				expect(
					requests.includes(astro.resolveUrl('/uses')),
					'/uses was prefetched on hover'
				).toBeTruthy();
			});
		});
	});
});
