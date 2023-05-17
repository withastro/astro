import { expect } from '@playwright/test';
import { testFactory, waitForHydrate } from './test-utils.js';

const test = testFactory({
	root: './fixtures/lit-component/',
});

// TODO: configure playwright to handle web component APIs
// https://github.com/microsoft/playwright/issues/14241
test.describe('Lit components', () => {
	test.describe('Development', () => {
		let devServer;
		const t = test.extend({});

		t.beforeAll(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		t.afterAll(async () => {
			await devServer.stop();
		});

		t('client:idle', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const counter = page.locator('#client-idle');
			await expect(counter, 'component is visible').toBeVisible();
			await expect(counter).toHaveCount(1);

			const count = counter.locator('p');
			await expect(count, 'initial count is 10').toHaveText('Count: 10');

			await waitForHydrate(page, counter);

			const inc = counter.locator('button');
			await inc.click();

			await expect(count, 'count incremented by 1').toHaveText('Count: 11');
		});

		t('non-deferred attribute serialization', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const counter = page.locator('#non-deferred');
			const count = counter.locator('p');
			await expect(count, 'initial count is 10').toHaveText('Count: 10');

			await waitForHydrate(page, counter);

			const inc = counter.locator('button');
			await inc.click();

			await expect(count, 'count incremented by 1').toHaveText('Count: 11');
		});

		t('client:load', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const counter = page.locator('#client-load');
			await expect(counter, 'component is visible').toBeVisible();

			const count = counter.locator('p');
			await expect(count, 'initial count is 10').toHaveText('Count: 10');

			await waitForHydrate(page, counter);

			const inc = counter.locator('button');
			await inc.click();

			await expect(count, 'count incremented by 1').toHaveText('Count: 11');
		});

		t('client:visible', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			// Make sure the component is on screen to trigger hydration
			const counter = page.locator('#client-visible');
			await counter.scrollIntoViewIfNeeded();
			await expect(counter, 'component is visible').toBeVisible();

			const count = counter.locator('p');
			await expect(count, 'initial count is 10').toHaveText('Count: 10');

			await waitForHydrate(page, counter);

			const inc = counter.locator('button');
			await inc.click();

			await expect(count, 'count incremented by 1').toHaveText('Count: 11');
		});

		t('client:media', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/media'));

			const counter = page.locator('#client-media');
			await expect(counter, 'component is visible').toBeVisible();

			const count = counter.locator('p');
			await expect(count, 'initial count is 10').toHaveText('Count: 10');

			const inc = counter.locator('button');
			await inc.click();

			await expect(count, 'component not hydrated yet').toHaveText('Count: 10');

			// Reset the viewport to hydrate the component (max-width: 50rem)
			await page.setViewportSize({ width: 414, height: 1124 });
			await waitForHydrate(page, counter);

			await inc.click();
			await expect(count, 'count incremented by 1').toHaveText('Count: 11');
		});

		t('client:only', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const label = page.locator('#client-only');
			await expect(label, 'component is visible').toBeVisible();

			// Light DOM reconstructed correctly (slots are rendered alphabetically) and shadow dom content rendered
			await expect(label, 'slotted text is in DOM').toHaveText(
				'Framework client:only component Should not be visible Shadow dom default content should not be visible'
			);

			// Projected content should be visible
			await expect(
				page.locator('#client-only .default'),
				'slotted element is visible'
			).toBeVisible();
			await expect(page.locator('#client-only .foo1'), 'slotted element is visible').toBeVisible();
			await expect(page.locator('#client-only .foo2'), 'slotted element is visible').toBeVisible();

			// Non-projected content should not be visible
			await expect(
				page.locator('#client-only [slot="quux"]'),
				'element without slot is not visible'
			).toBeHidden();

			// Default slot content should not be visible
			await expect(
				page.locator('#client-only .defaultContent'),
				'element without slot is not visible'
			).toBeHidden();
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
			try {
				await astro.build();
			} catch (err) {
				// There's this strange error on build since the dev server already defined `my-counter`,
				// however the tests still pass with this error, so swallow it.
				if (!err.message.includes(`Failed to execute 'define' on 'CustomElementRegistry'`)) {
					throw err;
				}
			}
		});

		t.beforeAll(async ({ astro }) => {
			previewServer = await astro.preview();
		});

		t.afterAll(async () => {
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
