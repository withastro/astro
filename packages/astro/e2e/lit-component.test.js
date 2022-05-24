import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/lit-component/' });
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
test.describe.skip('Lit components', () => {
	test('client:idle', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#client-idle');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('p');
		await expect(count, 'initial count is 0').toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('Count: 1');
	});

	test('client:load', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#client-load');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('p');
		await expect(count, 'initial count is 0').toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('Count: 1');
	});

	test('client:visible', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// Make sure the component is on screen to trigger hydration
		const counter = page.locator('#client-visible');
		await counter.scrollIntoViewIfNeeded();
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('p');
		await expect(count, 'initial count is 0').toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('Count: 1');
	});

	test('client:media', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/media'));

		const counter = page.locator('#client-media');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('p');
		await expect(count, 'initial count is 0').toHaveText('Count: 0');

		const inc = counter.locator('button');
		await inc.click();

		await expect(count, 'component not hydrated yet').toHaveText('Count: 0');

		// Reset the viewport to hydrate the component (max-width: 50rem)
		await page.setViewportSize({ width: 414, height: 1124 });

		await inc.click();
		await expect(count, 'count incremented by 1').toHaveText('Count: 1');
	});

	test('HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const label = page.locator('#client-idle h1');

		await astro.editFile('./src/pages/index.astro', (original) =>
			original.replace('Hello, client:idle!', 'Hello, updated client:idle!')
		);

		await expect(label, 'slot text updated').toHaveText('Hello, updated client:idle!');
	});
});
