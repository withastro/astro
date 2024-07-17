import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/server-islands/' });

test.describe('Server islands', () => {
	test.describe('Development', () => {
		let devServer;

		test.beforeAll(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		test.afterAll(async () => {
			await devServer.stop();
		});

		test('Load content from the server', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));
			let el = page.locator('#island');

			await expect(el, 'element rendered').toBeVisible();
			await expect(el, 'should have content').toHaveText('I am an island');
		});

		test('Can be in an MDX file', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/mdx'));
			let el = page.locator('#island');

			await expect(el, 'element rendered').toBeVisible();
			await expect(el, 'should have content').toHaveText('I am an island');
		});

		test('Slots are provided back to the server islands', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));
			let el = page.locator('#children');

			await expect(el, 'element rendered').toBeVisible();
		});
	});

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
			await page.goto(astro.resolveUrl('/'));

			let el = page.locator('#island');

			await expect(el, 'element rendered').toBeVisible();
			await expect(el, 'should have content').toHaveText('I am an island');
		});
	});
});
