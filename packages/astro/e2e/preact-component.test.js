import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/preact-component/' });
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

test.describe('Preact components', () => {
	test('server only', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#server-only');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('0');
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

		const counter = page.locator('#client-load');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('client:visible', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// Make sure the component is on screen to trigger hydration
		const counter = page.locator('#client-visible');
		await counter.scrollIntoViewIfNeeded();
		await expect(counter, 'component is visible').toBeVisible();

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

	test('client:only', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const label = page.locator('#client-only');
		await expect(label, 'component is visible').toBeVisible();

		await expect(label, 'slot text is visible').toHaveText('Preact client:only component');
	});

	test('HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const count = page.locator('#client-idle pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		// Edit the component's initial count prop
		await astro.editFile('./src/pages/index.astro', (original) =>
			original.replace('id="client-idle" {...someProps}', 'id="client-idle" count={5}')
		);

		await expect(count, 'count prop updated').toHaveText('5');

		// Edit the component's slot text
		await astro.editFile('./src/components/JSXComponent.jsx', (original) =>
			original.replace('Preact client:only component', 'Updated preact client:only component')
		);

		const label = page.locator('#client-only');
		await expect(label, 'client:only component is visible').toBeVisible();
		await expect(label, 'client:only slot text is visible').toHaveText(
			'Updated preact client:only component'
		);

		// Edit the imported CSS file
		await astro.editFile('./src/components/Counter.css', (original) =>
			original.replace('font-size: 2em;', 'font-size: 24px;')
		);

		await expect(count, 'imported styles updated').toHaveCSS('font-size', '24px');
	});
});
