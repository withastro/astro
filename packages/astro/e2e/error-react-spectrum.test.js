import { expect } from '@playwright/test';
import { testFactory, getErrorOverlayMessage } from './test-utils.js';

const test = testFactory({ root: './fixtures/error-react-spectrum/' });

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async ({ astro }) => {
	await devServer.stop();
});

test.describe('Error: React Spectrum', () => {
	test('overlay', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const message = await getErrorOverlayMessage(page);
		expect(message).toMatch('@adobe/react-spectrum is not compatible');
	});
});
