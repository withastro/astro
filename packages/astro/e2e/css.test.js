import { expect } from '@playwright/test';
import { getColor, isWindows, testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/css/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('CSS HMR', () => {
	test.skip(isWindows, 'TODO: fix css hmr in windows');

	test('edit CSS from @import', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const h = page.locator('h1');
		expect(await getColor(h)).toBe('rgb(255, 0, 0)');

		await astro.editFile('./src/styles/main.css', (original) =>
			original.replace('--h1-color: red;', '--h1-color: green;')
		);

		expect(await getColor(h)).toBe('rgb(0, 128, 0)');
	});
});
