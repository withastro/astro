import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/style-prefetch/' });

test.describe('Style prefetch', () => {
	test.describe('dev', () => {
		let devServer;

		test.beforeEach(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		test.afterEach(async () => {
			await devServer.stop();
		});

		testPrefetch();
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

		testPrefetch();
	});

	function testPrefetch() {
		test.describe('prefetches rel="prefetch" links', () => {
			test('style fetching', async ({ page, astro }) => {
				const requests = [];

				page.on('request', async (request) => requests.push(request.url()));

				await page.goto(astro.resolveUrl('/'));

				await page.waitForLoadState('networkidle');

				await expect(requests.filter((req) => req.includes('/style1'))).toBeTruthy();
				await expect(requests.filter((req) => req.includes('/style2'))).toBeTruthy();
				const cssRequestCount = requests.filter((req) => req.includes('/main.css')).length;
				await expect(cssRequestCount).toBe(1);
			});
		});
	}
});
