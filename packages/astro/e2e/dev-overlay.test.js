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

		const devToolbar = page.locator('astro-dev-toolbar');
		await expect(devToolbar).toHaveCount(1);
	});

	test('shows plugin name on hover', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro"]');
		const pluginButtonTooltip = pluginButton.locator('.item-tooltip');
		await pluginButton.hover();

		await expect(pluginButtonTooltip).toBeVisible();
	});

	test('can open Astro plugin', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro"]');
		await pluginButton.click();

		const astroPluginCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro"]'
		);
		const astroWindow = astroPluginCanvas.locator('astro-dev-toolbar-window');
		await expect(astroWindow).toHaveCount(1);
		await expect(astroWindow).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(astroWindow).not.toBeVisible();
	});

	test('xray shows highlights and tooltips', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:xray"]');
		await pluginButton.click();

		const xrayCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:xray"]'
		);
		const xrayHighlight = xrayCanvas.locator('astro-dev-toolbar-highlight');
		await expect(xrayHighlight).toBeVisible();

		await xrayHighlight.hover();
		const xrayHighlightTooltip = xrayHighlight.locator('astro-dev-toolbar-tooltip');
		await expect(xrayHighlightTooltip).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(xrayHighlight).not.toBeVisible();
		await expect(xrayHighlightTooltip).not.toBeVisible();
	});

	test('xray shows no islands message when there are none', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/xray-no-islands'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:xray"]');
		await pluginButton.click();

		const xrayCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:xray"]'
		);
		const auditHighlight = xrayCanvas.locator('astro-dev-toolbar-highlight');
		await expect(auditHighlight).not.toBeVisible();

		const xrayWindow = xrayCanvas.locator('astro-dev-toolbar-window');
		await expect(xrayWindow).toHaveCount(1);
		await expect(xrayWindow).toBeVisible();

		await expect(xrayWindow.locator('astro-dev-toolbar-icon[icon=lightbulb]')).toBeVisible();
	});

	test('audit shows higlights and tooltips', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:audit"]');
		await pluginButton.click();

		const auditCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:audit"]'
		);
		const auditHighlight = auditCanvas.locator('astro-dev-toolbar-highlight');
		await expect(auditHighlight).toBeVisible();

		await auditHighlight.hover();
		const auditHighlightTooltip = auditHighlight.locator('astro-dev-toolbar-tooltip');
		await expect(auditHighlightTooltip).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(auditHighlight).not.toBeVisible();
		await expect(auditHighlightTooltip).not.toBeVisible();
	});

	test('audit shows no issues message when there are no issues', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/audit-no-warning'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:audit"]');
		await pluginButton.click();

		const auditCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:audit"]'
		);
		const auditHighlight = auditCanvas.locator('astro-dev-toolbar-highlight');
		await expect(auditHighlight).not.toBeVisible();

		const auditWindow = auditCanvas.locator('astro-dev-toolbar-window');
		await expect(auditWindow).toHaveCount(1);
		await expect(auditWindow).toBeVisible();

		await expect(auditWindow.locator('astro-dev-toolbar-icon[icon=check-circle]')).toBeVisible();
	});

	test('adjusts tooltip position if off-screen', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/tooltip-position'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:audit"]');
		await pluginButton.click();

		const auditCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:audit"]'
		);
		const auditHighlights = auditCanvas.locator('astro-dev-toolbar-highlight');
		for (const highlight of await auditHighlights.all()) {
			await expect(highlight).toBeVisible();
			await highlight.hover();
			const tooltip = highlight.locator('astro-dev-toolbar-tooltip');
			await expect(tooltip).toBeVisible();
			const tooltipBox = await tooltip.boundingBox();
			const { clientWidth, clientHeight } = await page.evaluate(() => ({
				clientWidth: document.documentElement.clientWidth,
				clientHeight: document.documentElement.clientHeight,
			}));
			expect(tooltipBox.x + tooltipBox.width).toBeLessThan(clientWidth);
			expect(tooltipBox.y + tooltipBox.height).toBeLessThan(clientHeight);
		}
	});

	test('can open Settings plugin', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-toolbar');
		const pluginButton = overlay.locator('button[data-plugin-id="astro:settings"]');
		await pluginButton.click();

		const settingsPluginCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:settings"]'
		);
		const settingsWindow = settingsPluginCanvas.locator('astro-dev-toolbar-window');
		await expect(settingsWindow).toHaveCount(1);
		await expect(settingsWindow).toBeVisible();

		// Toggle plugin off
		await pluginButton.click();
		await expect(settingsWindow).not.toBeVisible();
	});

	test('Opening a plugin closes the currently opened plugin', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-toolbar');
		let pluginButton = overlay.locator('button[data-plugin-id="astro:settings"]');
		await pluginButton.click();

		const settingsPluginCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:settings"]'
		);
		const settingsWindow = settingsPluginCanvas.locator('astro-dev-toolbar-window');
		await expect(settingsWindow).toHaveCount(1);
		await expect(settingsWindow).toBeVisible();

		// Click the astro plugin
		pluginButton = overlay.locator('button[data-plugin-id="astro"]');
		await pluginButton.click();

		const astroPluginCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro"]'
		);
		const astroWindow = astroPluginCanvas.locator('astro-dev-toolbar-window');
		await expect(astroWindow).toHaveCount(1);
		await expect(astroWindow).toBeVisible();

		await expect(settingsWindow).not.toBeVisible();
	});

	test('Settings plugin contains message on disabling the overlay', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const overlay = page.locator('astro-dev-toolbar');
		let pluginButton = overlay.locator('button[data-plugin-id="astro:settings"]');
		await pluginButton.click();

		const settingsPluginCanvas = overlay.locator(
			'astro-dev-toolbar-plugin-canvas[data-plugin-id="astro:settings"]'
		);
		const settingsWindow = settingsPluginCanvas.locator('astro-dev-toolbar-window');
		await expect(settingsWindow).toHaveCount(1);
		await expect(settingsWindow).toBeVisible();

		const hideOverlay = settingsWindow.getByRole('heading', { name: 'Hide toolbar' });
		await expect(hideOverlay).toBeVisible();
	});
});
