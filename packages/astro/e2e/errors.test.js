import { expect } from '@playwright/test';
import { getErrorOverlayContent, silentLogging, testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/errors/',
	// Only test the error overlay, don't print to console
	vite: {
		logLevel: 'silent',
	},
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer({
		// Only test the error overlay, don't print to console
		logging: silentLogging,
	});
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

	test('shows correct line when a style preprocess has an error', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/astro-sass-error'), { waitUntil: 'networkidle' });

		const { fileLocation, absoluteFileLocation } = await getErrorOverlayContent(page);
		const absoluteFileUrl = 'file://' + absoluteFileLocation.replace(/:\d+:\d+$/, '');

		const fileExists = astro.pathExists(absoluteFileUrl);
		expect(fileExists).toBeTruthy();

		const fileContent = await astro.readFile(absoluteFileUrl);
		const lineNumber = absoluteFileLocation.match(/:(\d+):\d+$/)[1];
		const highlightedLine = fileContent.split('\n')[lineNumber - 1];
		expect(highlightedLine).toContain(`@use '../styles/inexistent' as *;`);

		expect(fileLocation).toMatch(/^pages\/astro-sass-error.astro/);
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

	test('astro glob no match error', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/astro-glob-no-match'), { waitUntil: 'networkidle' });
		const message = (await getErrorOverlayContent(page)).message;
		expect(message).toMatch('did not return any matching files');
	});

	test('astro glob used outside of an astro file', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/astro-glob-outside-astro'), { waitUntil: 'networkidle' });
		const message = (await getErrorOverlayContent(page)).message;
		expect(message).toMatch('can only be used in');
	});
});
