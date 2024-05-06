import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/actions-blog/' });

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Astro Actions - Blog', () => {
	test('Like action', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/blog/first-post/'));

		const likeButton = page.locator('button[aria-label="Like"]');
		await expect(likeButton, 'like button starts with 10 likes').toContainText('10');
		await likeButton.click();
		await expect(likeButton, 'like button should be disabled while loading').toBeDisabled();
		await expect(likeButton, 'like button should increment likes').toContainText('11');
	});
});
