import { expect } from '@playwright/test';
import { testFactory, getErrorOverlayMessage } from './test-utils.js';

const test = testFactory({ root: './fixtures/error-react-spectrum/' });

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async ({ astro }) => {
	await devServer.stop();
	astro.resetAllFiles();
});

test.describe('Error: React Spectrum', () => {
	test('overlay', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const message = await getErrorOverlayMessage(page);
		expect(message).toMatch('@adobe/react-spectrum is not compatible')
	});
});
