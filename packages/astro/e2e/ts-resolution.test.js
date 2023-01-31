import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/ts-resolution/' });

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

		t.beforeAll(async ({ astro }) => {
			devServer = await astro.startDevServer();
		});

		t.afterAll(async () => {
			await devServer.stop();
		});

		runTest(t);
	});

	test.describe('Production', () => {
		const t = test.extend({});

		let previewServer;

		t.beforeAll(async ({ astro }) => {
			await astro.build();
			previewServer = await astro.preview();
		});

		t.afterAll(async () => {
			await previewServer.stop();
		});

		runTest(t);
	});
});
