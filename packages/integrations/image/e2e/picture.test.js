import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/basic-picture/' });

test.describe('Basic picture', () => {
	test.describe('Production', () => {
		let previewServer;

		test.beforeEach(async ({ astro }) => {
			await astro.build();
			previewServer = await astro.preview();
		});

		test.afterEach(async () => {
			await previewServer.stop();
		});

		test('requests chosen src', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			await page.waitForLoadState('networkidle');

			const imgs = await page.locator('picture img').all();
			for (const img of imgs) {
				const currentSrc = await img.evaluate((elem) => elem.currentSrc);
				const src = await img.evaluate((elem) => elem.src);
				expect(currentSrc).not.toEqual(src);
			}
		});
	});
});
