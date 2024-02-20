import { expect } from '@playwright/test';
import { testFactory } from '../test-utils.js';
import { makeClientTests } from '../utils/make-client-tests.js';

export function sharedIndependentTests(opts, { canReplayClicks = false } = {}) {
	const test = testFactory(opts);

	let previewServer;

	test.beforeAll(async ({ astro }) => {
		await astro.build();
		previewServer = await astro.preview();
		await astro.rmDir('node_modules');
	});

	test.afterAll(async () => {
		await previewServer.stop();
	});

	const createTests = ({ pageUrl }) => {
		test('server only', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl(pageUrl));

			const counter = page.locator('#server-only');
			await expect(counter, 'component is visible').toBeVisible();

			const count = counter.locator('pre');
			await expect(count, 'initial count is 0').toHaveText('0');

			const inc = counter.locator('.increment');
			await inc.click();

			await expect(count, 'component not hydrated').toHaveText('0');
		});

		makeClientTests({ test, pageUrl, canReplayClicks });
	};

	return {
		test,
		createTests,
	};
}
