import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/ts-resolution/' });
		await use(fixture);
	},
});

function runTest(it) {
	it('client:idle', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const counter = page.locator('#client-idle');
		await expect(counter, 'component is visible').toBeVisible();

		const count = counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const inc = counter.locator('.increment');
		await inc.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});
}

test.describe('TypeScript resolution -', () => {
	test.describe('Development', () => {
		const t = test.extend({});

		let devServer;

		t.beforeEach(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		t.afterEach(async () => {
			await devServer.stop();
		});

		runTest(t);
	});

	test.describe('Production', () => {
		const t = test.extend({});

		let previewServer;

		t.beforeAll(async ({ astro }) => {
			await astro.build();
		});

		t.beforeEach(async ({ astro }) => {
			previewServer = await astro.preview();
		});

		t.afterEach(async () => {
			await previewServer.stop();
		});

		runTest(t);
	});
});
