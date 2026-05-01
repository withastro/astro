import { expect } from '@playwright/test';
import { type DevServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, {
	root: './fixtures/hmr/',
	devToolbar: {
		enabled: false,
	},
});

let devServer: DevServer;

function throwPageShouldNotReload() {
	throw new Error('Page should not reload in HMR');
}

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(({ page }) => {
	page.off('load', throwPageShouldNotReload);
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
			original.replace('before', 'after'),
		);

		await expect(h, 'text changed').toHaveText('after');
	});
});

test.describe('Styles', () => {
	test('dependencies cause refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-dep'));

		page.once('load', throwPageShouldNotReload);

		const h = page.locator('h1');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/styles/vars.scss', (original) => original.replace('blue', 'red'));

		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('external CSS refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-external'));

		page.once('load', throwPageShouldNotReload);

		const h = page.locator('h1');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/styles/css-external.css', (original) =>
			original.replace('blue', 'red'),
		);

		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('inline styles refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-inline'));

		page.once('load', throwPageShouldNotReload);

		const h = page.locator('h1.css-inline');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/pages/css-inline.astro', (original) =>
			original.replace('blue', 'red'),
		);
		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('external SCSS refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/scss-external'));

		page.once('load', throwPageShouldNotReload);

		const h = page.locator('h1');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/styles/scss-external.scss', (original) =>
			original.replace('blue', 'red'),
		);

		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('SCSS modules refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/scss-module'));

		page.once('load', throwPageShouldNotReload);

		const h = page.locator('h1');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/styles/scss-module.module.scss', (original) =>
			original.replace('blue', 'red'),
		);

		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('added style tag refresh with full-reload', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-inline-component'));

		const h = page.locator('h1.title-with-no-color');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 0)');

		await astro.editFile(
			'./src/components/title-with-no-color.astro',
			(original) => original + '\n<style>h1 { color: red; }</style>',
		);
		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('multiple added style tags refresh with full-reload', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-inline-component'));

		const h = page.locator('h1.title-with-color');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile(
			'./src/components/title-with-color.astro',
			(original) => original + '\n<style>h1 { font-style: italic; }</style>',
		);
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');
		await expect(h).toHaveCSS('font-style', 'italic');
	});

	test('removed style tag refresh with full-reload', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-inline-component'));

		const h = page.locator('h1.title-with-color');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/components/title-with-color.astro', (original) =>
			original.replace(/<style>.*$/s, ''),
		);
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 0)');
	});
});

test.describe('Middleware', () => {
	test('middleware changes are picked up without restart', async ({ astro }) => {
		// Verify original middleware header
		const res1 = await astro.fetch('/middleware-test');
		expect(res1.headers.get('x-test-middleware')).toBe('before');

		// Edit middleware to change the header value
		await astro.editFile('./src/middleware.ts', (original) =>
			original.replace("'before'", "'after'"),
		);

		// Wait briefly for HMR to propagate
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Verify the new header value is returned without server restart
		const res2 = await astro.fetch('/middleware-test');
		expect(res2.headers.get('x-test-middleware')).toBe('after');
	});
});
