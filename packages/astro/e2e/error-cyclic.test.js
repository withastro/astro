import { expect } from '@playwright/test';
import { testFactory, getErrorOverlayMessage } from './test-utils.js';

const test = testFactory({ root: './fixtures/error-cyclic/' });

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async ({ astro }) => {
	await devServer.stop();
	astro.resetAllFiles();
});

test.describe('Error: Cyclic Reference', () => {
	test('overlay', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const message = await getErrorOverlayMessage(page);
		expect(message).toMatch('Cyclic reference');
	});
});
