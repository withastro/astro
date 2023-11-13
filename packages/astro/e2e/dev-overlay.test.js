import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/dev-overlay/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Dev Overlay', () => {
	test('dev overlay exists in the page', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const devOVerlay = page.locator('astro-dev-overlay');
		await expect(devOVerlay).toHaveCount(1);
	});

	test('shows plugin name on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-overlay');
		const pluginButton = overlay.locator('button[data-plugin-id="astro"]');
		const pluginButtonTooltip = pluginButton.locator('.item-tooltip');
		await pluginButton.hover();

		await expect(pluginButtonTooltip).toBeVisible();
	});

	test('can open Astro plugin', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-overlay');
		const pluginButton = overlay.locator('button[data-plugin-id="astro"]');
		await pluginButton.click();

		const astroPluginCanvas = overlay.locator(
			'astro-dev-overlay-plugin-canvas[data-plugin-id="astro"]'
		);
		const astroWindow = astroPluginCanvas.locator('astro-dev-overlay-window');
		await expect(astroWindow).toHaveCount(1);
		await expect(astroWindow).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(astroWindow).not.toBeVisible();
	});

	test('xray shows highlights and tooltips', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-overlay');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:xray"]');
		await pluginButton.click();

		const xrayCanvas = overlay.locator(
			'astro-dev-overlay-plugin-canvas[data-plugin-id="astro:xray"]'
		);
		const xrayHighlight = xrayCanvas.locator('astro-dev-overlay-highlight');
		await expect(xrayHighlight).toBeVisible();

		await xrayHighlight.hover();
		const xrayHighlightTooltip = xrayHighlight.locator('astro-dev-overlay-tooltip');
		await expect(xrayHighlightTooltip).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(xrayHighlight).not.toBeVisible();
		await expect(xrayHighlightTooltip).not.toBeVisible();
	});

	test('audit shows higlights and tooltips', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-overlay');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:audit"]');
		await pluginButton.click();

		const auditCanvas = overlay.locator(
			'astro-dev-overlay-plugin-canvas[data-plugin-id="astro:audit"]'
		);
		const auditHighlight = auditCanvas.locator('astro-dev-overlay-highlight');
		await expect(auditHighlight).toBeVisible();

		await auditHighlight.hover();
		const auditHighlightTooltip = auditHighlight.locator('astro-dev-overlay-tooltip');
		await expect(auditHighlightTooltip).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(auditHighlight).not.toBeVisible();
		await expect(auditHighlightTooltip).not.toBeVisible();
	});

	test('can open Settings plugin', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-overlay');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:settings"]');
		await pluginButton.click();

		const settingsPluginCanvas = overlay.locator(
			'astro-dev-overlay-plugin-canvas[data-plugin-id="astro:settings"]'
		);
		const settingsWindow = settingsPluginCanvas.locator('astro-dev-overlay-window');
		await expect(settingsWindow).toHaveCount(1);
		await expect(settingsWindow).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(settingsWindow).not.toBeVisible();
	});
});
