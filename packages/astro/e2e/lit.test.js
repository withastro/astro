import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/lit/' });
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

// TODO: configure playwright to handle web component APIs
// https://github.com/microsoft/playwright/issues/14241
test.describe.skip('Lit', () => {
	test('client:idle', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-idle');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('p');
		await expect(count).toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count).toHaveText('Count: 1');
	});

	test('client:load', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
	
		const counter = page.locator('#client-load');
		await expect(counter).toBeVisible();
		
		const count = counter.locator('p');
		await expect(count).toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count).toHaveText('Count: 1');
	});

	test('client:visible', async ({ page, astro }) => {
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

	test('client:media', async ({ page, astro }) => {
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

	test('HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// test 1: updating the page component
		await astro.editFile(
			'./src/pages/index.astro',
			(original) => original.replace('Hello, client:idle!', 'Hello, updated client:idle!')
		);

		await astro.onNextChange();

		const label = page.locator('#client-idle h1');
		await expect(label).toHaveText('Hello, updated client:idle!')
	});
});
