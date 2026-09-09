import { expect } from '@playwright/test';
import { type DevServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/content-collections/' });

let devServer: DevServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async ({ astro }) => {
	await devServer.stop();
	astro.resetAllFiles();
});

test.describe('Content Collections', () => {
	test('HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		await astro.editFile('./src/components/MyComponent.astro', (original) =>
			original.replace('red', 'green'),
		);

		const h1 = page.locator('#my-heading');

		await expect(h1, 'should have green color').toHaveCSS('color', 'rgb(0, 128, 0)');
	});

	test('framework styles keep HMR after returning to a content route', async ({ page, astro }) => {
		let loads = 0;
		page.on('load', () => loads++);
		await page.goto(astro.resolveUrl('/'));

		const message = page.locator('.svelte-message');
		await expect(message).toHaveCSS('background-color', 'rgb(128, 0, 0)');
		const messageStyle = page.locator('style[data-vite-dev-id*="SvelteMessage.svelte"]');
		await expect(messageStyle).toHaveCount(1);
		await messageStyle.evaluate((element) => (element.dataset.hmrStyle = 'svelte-message'));
		await page.click('#away');
		await page.click('#back');
		await expect(message).toBeVisible();
		await expect(page.locator('style[data-hmr-style="svelte-message"]')).toHaveCount(1);

		await astro.editFile('./src/components/SvelteMessage.svelte', (original) =>
			original.replace('background-color: maroon', 'background-color: navy'),
		);

		await expect(message).toHaveCSS('background-color', 'rgb(0, 0, 128)');
		expect(loads).toBe(1);
	});
});
