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
	await test.step('client:idle', async () => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-idle');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('p');
		await expect(count).toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count).toHaveText('Count: 1');
	});

	await test.step('client:load', async () => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-load');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('p');
		await expect(count).toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count).toHaveText('Count: 1');
	});

	await test.step('client:visible', async () => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-visible');
		await counter.scrollIntoViewIfNeeded();
		await expect(counter).toBeVisible();
		
		const count = counter.locator('p');
		await expect(count).toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count).toHaveText('Count: 1');
	});

	await test.step('client:media', async () => {
		await page.goto(astro.resolveUrl('/media'));
	
		const counter = page.locator('#client-media');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('p');
		await expect(count).toHaveText('Count: 0');

		// test 1: not hydrated on large screens
		const inc = counter.locator('button');
		await inc.click();
		await expect(count).toHaveText('Count: 0');

		// test 2: hydrated on mobile (max-width: 50rem)
		await page.setViewportSize({ width: 414, height: 1124 });
		await inc.click();
		await expect(count).toHaveText('Count: 1');
	});

	await test.step('HMR', async () => {
		await page.goto(astro.resolveUrl('/'));
	
		const afterHMR = onAfterHMR(page);

		// test 1: updating the page component
		await astro.writeFile(
			'src/pages/index.astro',
			(original) => original.replace('Hello, client:idle!', 'Hello, updated client:idle!')
		);

		await afterHMR;

		const label = page.locator('#client-idle h1');
		await expect(label).toHaveText('Hello, updated client:idle!')
	});
});
