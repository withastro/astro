import { expect } from '@playwright/test';
import { type DevServer, getErrorOverlayContent, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, {
	root: './fixtures/error-sass/',
});

let devServer: DevServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async ({ astro }) => {
	await devServer.stop();
	astro.resetAllFiles();
});

test.describe('Error: Sass', () => {
	test('overlay', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const message = (await getErrorOverlayContent(page)).message;
		expect(message).toMatch('Undefined variable');
	});
});
