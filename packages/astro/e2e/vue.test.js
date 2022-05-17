import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/vue/' });
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

test.only('Vue', async ({ page, astro }) => {
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

		await countInc.click();

		await expect(count).toHaveText('1');
		await expect(countDup).toHaveText('0');
		await expect(countStep).toHaveText('0');

		await countDupInc.click();

		await expect(count).toHaveText('1');
		await expect(countDup).toHaveText('1');
		await expect(countStep).toHaveText('0');

		await countStepInc.click();
		await countStepInc.click();

		await expect(count).toHaveText('1');
		await expect(countDup).toHaveText('1');
		await expect(countStep).toHaveText('4');
	});

	await test.step('client:visible', async () => {
		const counter = page.locator('#client-visible');
		await counter.scrollIntoViewIfNeeded();
		await expect(counter).toBeVisible();

		await counter.scrollIntoViewIfNeeded();
		
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
			(original) => original.replace('Hello, client:visible!', 'Hello, updated client:visible!')
		);

		await astro.onNextChange();

		const label = page.locator('#client-visible h1');
		await expect(label).toHaveText('Hello, updated client:visible!');
	});
});
