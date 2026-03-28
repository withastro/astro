import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, { root: './fixtures/view-transitions/' });

let previewServer;

test.beforeAll(async ({ astro }) => {
	test.setTimeout(180_000);
	await astro.build();
	previewServer = await astro.preview();
});

test.afterAll(async () => {
	await previewServer?.stop();
});

test.describe('View Transitions preview', () => {
	test('cross-page fragment navigation stays on target after late layout shifts', async ({
		page,
		astro,
	}) => {
		await page.goto(astro.resolveUrl('/fragment-shift-from'));
		await page.click('#click-fragment-shift');

		const spacer = page.locator('#shift-spacer');
		await expect(spacer).toBeVisible();

		const target = page.locator('#shift-target');
		await expect(target).toBeInViewport();
	});
});
