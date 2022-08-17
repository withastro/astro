import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/nested-styles/' });

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Loading styles that are nested', () => {
	test('header', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const header = page.locator('header');

		await expect(header, 'should have background color').toHaveCSS(
			'background-color',
			'rgb(0, 0, 139)' // darkblue
		);
	});
});
