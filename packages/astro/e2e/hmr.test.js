import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, {
	root: './fixtures/hmr/',
	devToolbar: {
		enabled: false,
	},
});

let devServer;

function throwPageShouldNotReload() {
	throw new Error('Page should not reload in HMR');
}

async function waitForViteToSettle(page) {
	// Headless Chrome can trigger one immediate follow-up load after the initial Vite connection.
	// Wait for that to clear before asserting whether an edit caused a reload.
	await page.waitForTimeout(500);
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
		await waitForViteToSettle(page);

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
		await waitForViteToSettle(page);

		page.once('load', throwPageShouldNotReload);

		const h = page.locator('h1');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/styles/vars.scss', (original) => original.replace('blue', 'red'));

		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('external CSS refresh with HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-external'));
		await waitForViteToSettle(page);

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
		await waitForViteToSettle(page);

		page.once('load', throwPageShouldNotReload);

		const h = page.locator('h1.css-inline');
		await expect(h).toHaveCSS('color', 'rgb(0, 0, 255)');

		await astro.editFile('./src/pages/css-inline.astro', (original) =>
			original.replace('blue', 'red'),
		);
		await expect(h).toHaveCSS('color', 'rgb(255, 0, 0)');
	});

	test('added style tag refresh with full-reload', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/css-inline-component'));
		await waitForViteToSettle(page);

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
		await waitForViteToSettle(page);

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
		await waitForViteToSettle(page);

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
