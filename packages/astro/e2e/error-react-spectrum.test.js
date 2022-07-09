import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

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

		const errorOverlay = await page.waitForSelector('vite-error-overlay')
		expect(errorOverlay).toBeTruthy()
    const message = await errorOverlay.$$eval('.message-body', (m) => {
      return m[0].innerHTML
    })
		
		expect(message).toMatch('@adobe/react-spectrum')
	});
});
