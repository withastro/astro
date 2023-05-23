import { expect } from '@playwright/test';
import { getErrorOverlayContent, testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/errors/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async ({ astro }) => {
	await devServer.stop();
	astro.resetAllFiles();
});

test.describe('Error display', () => {
	test('detect syntax errors in template', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/astro-syntax-error'), { waitUntil: 'networkidle' });

		const message = (await getErrorOverlayContent(page)).message;
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
		await page.goto(astro.resolveUrl('/import-not-found'), { waitUntil: 'networkidle' });

		const message = (await getErrorOverlayContent(page)).message;
		expect(message).toMatch('Could not import ../abc.astro');

		await Promise.all([
			// Wait for page reload
			page.waitForNavigation(),
			// Edit the component file
			astro.editFile('./src/pages/import-not-found.astro', () => `<h1>No import error</h1>`),
		]);

		expect(await page.locator('vite-error-overlay').count()).toEqual(0);
	});

	test('shows correct file path when a page has an error', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/import-not-found'), { waitUntil: 'networkidle' });

		const { fileLocation, absoluteFileLocation } = await getErrorOverlayContent(page);
		const absoluteFileUrl = 'file://' + absoluteFileLocation.replace(/:\d+:\d+$/, '');
		const fileExists = astro.pathExists(absoluteFileUrl);

		expect(fileExists).toBeTruthy();
		expect(fileLocation).toMatch(/^pages\/import-not-found\.astro/);
	});

	test('shows correct file path when a component has an error', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/preact-runtime-error'), { waitUntil: 'networkidle' });

		const { fileLocation, absoluteFileLocation } = await getErrorOverlayContent(page);
		const absoluteFileUrl = 'file://' + absoluteFileLocation.replace(/:\d+:\d+$/, '');
		const fileExists = astro.pathExists(absoluteFileUrl);

		expect(fileExists).toBeTruthy();
		expect(fileLocation).toMatch(/^components\/PreactRuntimeError.jsx/);
	});

	test('framework errors recover when fixed', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/svelte-syntax-error'), { waitUntil: 'networkidle' });

		const message = (await getErrorOverlayContent(page)).message;
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
