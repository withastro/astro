import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/solid/' });
		await use(fixture);
	},
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async ({ astro }) => {
	await devServer.stop();
});

test.afterEach(async ({ astro }) => {
	astro.clean();
});

test.only('Solid', async ({ page, astro }) => {
	await page.goto(astro.resolveUrl('/'));

	await test.step('server only', async () => {
		const counter = page.locator('#server-only');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('0');
	});

	await test.step('client:idle', async () => {
		const counter = page.locator('#client-idle');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	await test.step('client:load', async () => {
		const counter = page.locator('#client-load');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	await test.step('client:visible', async () => {
		const counter = page.locator('#client-visible');
		await counter.scrollIntoViewIfNeeded();
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	await test.step('client:media', async () => {
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

	await test.step('HMR', async () => {
		// test 1: updating the page component
		await astro.editFile(
			'./src/pages/index.astro',
			(original) => original.replace('id="client-idle" {...someProps}', 'id="client-idle" count={5}')
		);

		await astro.onNextChange();

		const count = page.locator('#client-idle pre');
		await expect(count).toHaveText('5');

		// test 2: updating imported CSS
		await astro.editFile(
			'./src/components/Counter.css',
			(original) => original.replace('font-size: 2em;', 'font-size: 24px;')
		);

		await astro.onNextChange();

		await expect(count).toHaveCSS('font-size', '24px');
	});
});
