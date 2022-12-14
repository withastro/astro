import { expect } from '@playwright/test';
import { testFactory, getErrorOverlayContent } from './test-utils.js';

const test = testFactory({
	experimentalErrorOverlay: true,
	root: './fixtures/error-react-spectrum/',
});

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

		const message = (await getErrorOverlayContent(page)).hint;
		expect(message).toMatch('@adobe/react-spectrum is not compatible');
	});
});
