import { expect } from '@playwright/test';
import { type PreviewServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/server-islands-key/' });

test.describe('Server islands - Key reuse', () => {
	test.describe('Production', () => {
		let previewServer: PreviewServer;

		test.beforeAll(async ({ astro }) => {
			// Playwright's Node version doesn't have these functions, so stub them.
			process.stdout.clearLine = (() => true) as typeof process.stdout.clearLine;
			process.stdout.cursorTo = (() => true) as typeof process.stdout.cursorTo;
			process.env.ASTRO_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';
			await astro.build();
			previewServer = await astro.preview();
		});

		test.afterAll(async () => {
			await previewServer.stop();
			delete process.env.ASTRO_KEY;
		});

		test('Components render properly', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			let el = page.locator('#island');

			await expect(el, 'element rendered').toBeVisible();
			await expect(el, 'should have content').toHaveText('I am an island');
		});
	});
});
