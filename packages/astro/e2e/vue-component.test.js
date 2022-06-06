import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/vue-component/' });
		await use(fixture);
	},
});

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async () => {
	await devServer.stop();
});

test.describe('Vue components', () => {
	test('server only', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#server-only');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'component not hydrated').toHaveText('0');
	});

	test('client:idle', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#client-idle');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('client:load', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// Multiple counters on the page to verify islands aren't sharing state
		const counter = page.locator('#client-load');
		const counterDup = page.locator('#client-load-dup');
		const counterStep = page.locator('#client-load-step');

		await expect(counter).toBeVisible();
		await expect(counterDup).toBeVisible();
		await expect(counterStep).toBeVisible();

		const count = counter.locator('pre');
		const countDup = counterDup.locator('pre');
		const countStep = counterStep.locator('pre');

		const countInc = counter.locator('.increment');
		const countDupInc = counterDup.locator('.increment');
		const countStepInc = counterStep.locator('.increment');

		// Should only increment the first counter
		await countInc.click();

		await expect(count, 'intial count is 1').toHaveText('1');
		await expect(countDup, 'initial count is 0').toHaveText('0');
		await expect(countStep, 'initial count is 0').toHaveText('0');

		// Should only increment the second counter
		await countDupInc.click();

		await expect(count, "count didn't change").toHaveText('1');
		await expect(countDup, 'count incremented by 1').toHaveText('1');
		await expect(countStep, "count didn't change").toHaveText('0');

		// Should only increment the third counter
		// Expecting an increase of 4 becasuse the component's
		// step is set to 2
		await countStepInc.click();
		await countStepInc.click();

		await expect(count, "count didn't change").toHaveText('1');
		await expect(countDup, "count didn't change").toHaveText('1');
		await expect(countStep, 'count incremented by 4').toHaveText('4');
	});

	test('client:visible', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// Make sure the component is on screen to trigger hydration
		const counter = page.locator('#client-visible');
		await counter.scrollIntoViewIfNeeded();
		await expect(counter).toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('client:media', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#client-media');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();
		await expect(count, 'component not hydrated yet').toHaveText('0');

		// Reset the viewport to hydrate the component (max-width: 50rem)
		await page.setViewportSize({ width: 414, height: 1124 });
		await inc.click();
		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// Edit the component's slot text
		await astro.editFile('./src/pages/index.astro', (original) =>
			original.replace('Hello, client:visible!', 'Hello, updated client:visible!')
		);

		const counter = page.locator('#client-visible');
		const label = counter.locator('h1');

		await expect(label, 'slotted text updated').toHaveText('Hello, updated client:visible!');
		await expect(counter, 'component styles persisted').toHaveCSS('display', 'grid');
	});
});
