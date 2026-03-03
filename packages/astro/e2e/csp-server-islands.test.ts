import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, {
	root: './fixtures/csp-server-islands/',
});

test.describe('CSP Server islands', () => {
	test.describe('Production', () => {
		let previewServer;

		test.beforeAll(async ({ astro }) => {
			// Playwright's Node version doesn't have these functions, so stub them.
			process.stdout.clearLine = () => {};
			process.stdout.cursorTo = () => {};
			await astro.build();
			previewServer = await astro.preview();
		});

		test.afterAll(async () => {
			await previewServer.stop();
		});

		test('Only one component in prod', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/base/'));

			let el = page.locator('#basics .island');

			await expect(el, 'element rendered').toBeVisible();
			await expect(el, 'should have content').toHaveText('I am an island');
		});

		test('Props are encrypted', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));
			let el = page.locator('#basics .secret');
			await expect(el).toHaveText('test');
		});
	});
});
