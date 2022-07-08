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

		// TODO: fix this tet...
		const overlay = page.locator('vite-error-overlay');
		
		const text = await overlay.innerHTML();

		expect(text, 'should have overlay').toMatch('@adobe/react-spectrum');
	});
});
