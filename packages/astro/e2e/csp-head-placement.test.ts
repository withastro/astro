import { expect } from '@playwright/test';
import { type PreviewServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, {
	root: '../test/fixtures/csp/',
	outDir: './dist/csp-head-placement-e2e/',
});

let previewServer: PreviewServer;

test.beforeAll(async ({ astro }) => {
	await astro.build();
	previewServer = await astro.preview();
});

test.afterAll(async () => {
	await previewServer.stop();
});

test.describe('CSP meta tag placement', () => {
	test('applies the policy to scripts in <head>', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/head-placement/'));

		await expect(page.locator('body')).toHaveAttribute('data-bundled-script-ran', 'true');
		await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveCount(1);
		expect(await page.evaluate(() => (window as any).headScriptRan)).toBeUndefined();
		expect(await page.evaluate(() => (window as any).bodyScriptRan)).toBeUndefined();
		expect(JSON.parse((await page.locator('#data').textContent()) ?? '')).toEqual({
			example: '<meta charset="utf-8">',
		});
	});
});
