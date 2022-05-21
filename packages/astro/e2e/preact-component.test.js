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
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('0');
	});

	test('client:idle', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-idle');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	test('client:load', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-load');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	test('client:visible', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-visible');
		await counter.scrollIntoViewIfNeeded();
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	test('client:media', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-media');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		// test 1: not hydrated on large screens
		const inc = counter.locator('.increment');
		await inc.click();
		await expect(count).toHaveText('0');

		// test 2: hydrated on mobile (max-width: 50rem)
		await page.setViewportSize({ width: 414, height: 1124 });
		await inc.click();
		await expect(count).toHaveText('1');
	});

	test('client:only', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		const label = page.locator('#client-only');
		await expect(label).toBeVisible();

		await expect(label).toHaveText('Preact client:only component');
	});

	test.skip('HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		// test 1: updating the page component
		await astro.editFile(
			'./src/pages/index.astro',
			(original) => original.replace('id="client-idle" {...someProps}', 'id="client-idle" count={5}')
		);

		await astro.onNextChange();

		const count = page.locator('#client-idle pre');
		await expect(count).toHaveText('5');

		// test 2: updating the preact component
		await astro.editFile(
			'./src/components/JSXComponent.jsx',
			(original) => original.replace('Preact client:only component', 'Updated preact client:only component')
		);

		await astro.onNextChange();

		const label = page.locator('#client-only');
		await expect(label).toBeVisible();

		await expect(label).toHaveText('Updated preact client:only component');

		// test 3: updating imported CSS
		await astro.editFile(
			'./src/components/Counter.css',
			(original) => original.replace('font-size: 2em;', 'font-size: 24px;')
		);

		await expect(count).toHaveCSS('font-size', '24px');
	});
});
