import { test as base, expect } from '@playwright/test';
import { loadFixture, onAfterHMR } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/lit/' });
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

test.only('Lit', async ({ page, astro }) => {
	await page.goto(astro.resolveUrl('/'));

	await test.step('client:idle', async () => {
		const counter = page.locator('#counter-idle');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	await test.step('client:load', async () => {
		const counter = page.locator('#counter-load');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	await test.step('client:visible', async () => {
		const counter = page.locator('#counter-visible');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('pre');
		await expect(count).toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count).toHaveText('1');
	});

	await test.step('client:only', async () => {
		const label = page.locator('#client-only');
		await expect(label).toBeVisible();

		await expect(label).toHaveText('Preact client:only component');
	});

	await test.step('client:media', async () => {
		const counter = page.locator('#counter-media');
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
		const afterHMR = onAfterHMR(page);

		// test 1: updating the page component
		await astro.writeFile(
			'src/pages/index.astro',
			(original) => original.replace('id="counter-idle" {...someProps}', 'id="counter-idle" count={5}')
		);

		await afterHMR;

		const count = page.locator('#counter-idle pre');
		await expect(count).toHaveText('5');
	});
});
