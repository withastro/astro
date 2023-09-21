import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/hmr/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Scripts with dependencies', () => {
	test('refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/script-dep'));

		const h = page.locator('h1');
		await expect(h, 'original text set').toHaveText('before');

		await astro.editFile('./src/scripts/heading.js', (original) =>
			original.replace('before', 'after')
		);

		await expect(h, 'text changed').toHaveText('after');
	});
});

test.describe('Styles with dependencies', () => {
	test('refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-dep'));

		const h = page.locator('h1');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/styles/vars.scss', (original) => original.replace('blue', 'red'));

		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});
});
