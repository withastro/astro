import { expect } from '@playwright/test';
import { testFactory, getErrorOverlayMessage } from './test-utils.js';

const test = testFactory({ root: './fixtures/errors/' });

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async ({ astro }) => {
	await devServer.stop();
	astro.resetAllFiles();
});

test.describe('Error display', () => {
	test('detect syntax errors in template', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/astro-syntax-error'));

		const message = await getErrorOverlayMessage(page);
		expect(message).toMatch('Unexpected "}"');

		await Promise.all([
			// Wait for page reload
			page.waitForNavigation(),
			// Edit the component file
			await astro.editFile(
				'./src/pages/astro-syntax-error.astro',
				() => `<h1>No syntax error</h1>`
			),
		]);

		expect(await page.locator('vite-error-overlay').count()).toEqual(0);
	});

	test('shows useful error when frontmatter import is not found', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/import-not-found'));

		const message = await getErrorOverlayMessage(page);
		expect(message).toMatch('failed to load module for ssr: ../abc.astro');

		await Promise.all([
			// Wait for page reload
			page.waitForNavigation(),
			// Edit the component file
			astro.editFile('./src/pages/import-not-found.astro', () => `<h1>No import error</h1>`),
		]);

		expect(await page.locator('vite-error-overlay').count()).toEqual(0);
	});

	test('framework errors recover when fixed', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/svelte-syntax-error'));

		const message = await getErrorOverlayMessage(page);
		expect(message).toMatch('</div> attempted to close an element that was not open');

		await Promise.all([
			// Wait for page reload
			page.waitForNavigation(),
			// Edit the component file
			astro.editFile('./src/components/SvelteSyntaxError.svelte', () => `<h1>No mismatch</h1>`),
		]);

		expect(await page.locator('vite-error-overlay').count()).toEqual(0);
	});
});
