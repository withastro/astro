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
				const requestHandler = (request) => requests.push(request.url());

				page.on('request', requestHandler);

				await page.goto(astro.resolveUrl('/'), { waitUntil: 'networkidle' });

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

				page.off('request', requestHandler);
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

		test.describe('prefetches rel="prefetch" links', () => {
			test('skips /admin', async ({ page, astro }) => {
				const requests = [];
				const requestHandler = (request) => requests.push(request.url());

				page.on('request', requestHandler);

				await page.goto(astro.resolveUrl('/'), { waitUntil: 'networkidle' });

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

				page.off('request', requestHandler);
			});
		});
	});
});
