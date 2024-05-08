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

		const likeButton = page.getByLabel('Like');
		await expect(likeButton, 'like button starts with 10 likes').toContainText('10');
		await likeButton.click();
		await expect(likeButton, 'like button should increment likes').toContainText('11');
	});

	test('Comment action - validation error', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/blog/first-post/'));

		const authorInput = page.locator('input[name="author"]');
		const bodyInput = page.locator('textarea[name="body"]');

		await authorInput.fill('Ben');
		await bodyInput.fill('Too short');

		const submitButton = page.getByLabel('Post comment');
		await submitButton.click();

		await expect(page.locator('p[data-error="body"]')).toBeVisible();
	});

	test('Comment action - success', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/blog/first-post/'));

		const authorInput = page.locator('input[name="author"]');
		const bodyInput = page.locator('textarea[name="body"]');

		const body = 'This should be long enough.';
		await authorInput.fill('Ben');
		await bodyInput.fill(body);

		const submitButton = page.getByLabel('Post comment');
		await submitButton.click();

		const comment = await page.getByTestId('comment');
		await expect(comment).toBeVisible();
		await expect(comment).toContainText(body);
	});
});
