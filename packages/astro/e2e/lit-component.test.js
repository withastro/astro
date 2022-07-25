import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/lit-component/',
});

// TODO: configure playwright to handle web component APIs
// https://github.com/microsoft/playwright/issues/14241
test.describe('Lit components', () => {
	test.beforeEach(() => {
		delete globalThis.window;
	});

	test.describe('Development', () => {
		let devServer;
		const t = test.extend({});

		t.beforeEach(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		t.afterEach(async () => {
			await devServer.stop();
		});

		t('client:idle', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const counter = page.locator('#client-idle');
			await expect(counter, 'component is visible').toBeVisible();
			await expect(counter).toHaveCount(1);

			const count = counter.locator('p');
			await expect(count, 'initial count is 0').toHaveText('Count: 0');

			const inc = counter.locator('button');
			await inc.click();

			await expect(count, 'count incremented by 1').toHaveText('Count: 1');
		});

		t('client:load', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const counter = page.locator('#client-load');
			await expect(counter, 'component is visible').toBeVisible();

			const count = counter.locator('p');
			await expect(count, 'initial count is 0').toHaveText('Count: 0');

			const inc = counter.locator('button');
			await inc.click();

			await expect(count, 'count incremented by 1').toHaveText('Count: 1');
		});

		t('client:visible', async ({ page, astro }) => {
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

		t('client:media', async ({ page, astro }) => {
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

		t.skip('HMR', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const counter = page.locator('#client-idle');
			const label = counter.locator('h1');

			await astro.editFile('./src/pages/index.astro', (original) =>
				original.replace('Hello, client:idle!', 'Hello, updated client:idle!')
			);

			await expect(label, 'slot text updated').toHaveText('Hello, updated client:idle!');
			await expect(counter, 'component styles persisted').toHaveCSS('display', 'grid');
		});
	});

	test.describe('Production', () => {
		let previewServer;
		const t = test.extend({});

		t.beforeAll(async ({ astro }) => {
			// Playwright's Node version doesn't have these functions, so stub them.
			process.stdout.clearLine = () => {};
			process.stdout.cursorTo = () => {};
			await astro.build();
		});

		t.beforeEach(async ({ astro }) => {
			previewServer = await astro.preview();
		});

		t.afterEach(async () => {
			await previewServer.stop();
		});

		t('Only one component in prod', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/solo'));

			const counter = page.locator('my-counter');
			await expect(counter, 'component is visible').toBeVisible();
			await expect(counter, 'there is only one counter').toHaveCount(1);
		});
	});
});
