import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/dev-toolbar/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Dev Toolbar - Audits', () => {
	test('can warn about perf issues', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/audits-perf'));

		const toolbar = page.locator('astro-dev-toolbar');
		const appButton = toolbar.locator('button[data-app-id="astro:audit"]');
		await appButton.click();

		const auditCanvas = toolbar.locator('astro-dev-toolbar-app-canvas[data-app-id="astro:audit"]');
		const auditHighlights = auditCanvas.locator('astro-dev-toolbar-highlight');

		const count = await auditHighlights.count();
		expect(count).toEqual(2);

		for (const auditHighlight of await auditHighlights.all()) {
			await expect(auditHighlight).toBeVisible();

			const auditCode = await auditHighlight.getAttribute('data-audit-code');
			expect(auditCode.startsWith('perf-')).toBe(true);

			await auditHighlight.hover();
			const auditHighlightTooltip = auditHighlight.locator('astro-dev-toolbar-tooltip');
			await expect(auditHighlightTooltip).toBeVisible();
		}

		// Toggle app off
		await appButton.click();
	});
});
