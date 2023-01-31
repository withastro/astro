import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({
	root: './fixtures/namespaced-component/',
});

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Hydrating namespaced components', () => {
	test('Preact Component', async ({ page }) => {
		await page.goto('/');

		// Counter declared with: <ns.components.PreactCounter id="preact-counter-namespace" client:load>
		const namespacedCounter = await page.locator('#preact-counter-namespace');
		await expect(namespacedCounter, 'component is visible').toBeVisible();

		const namespacedCount = await namespacedCounter.locator('pre');
		await expect(namespacedCount, 'initial count is 0').toHaveText('0');

		const namespacedChildren = await namespacedCounter.locator('.children');
		await expect(namespacedChildren, 'children exist').toHaveText('preact (namespace import)');

		const namespacedIncrement = await namespacedCounter.locator('.increment');
		await namespacedIncrement.click();

		await expect(namespacedCount, 'count incremented by 1').toHaveText('1');

		// Counter declared with: <components.PreactCounterTwo id="preact-counter-named" client:load>
		const namedCounter = await page.locator('#preact-counter-named');
		await expect(namedCounter, 'component is visible').toBeVisible();

		const namedCount = await namedCounter.locator('pre');
		await expect(namedCount, 'initial count is 0').toHaveText('0');

		const namedChildren = await namedCounter.locator('.children');
		await expect(namedChildren, 'children exist').toHaveText('preact (named import)');

		const namedIncrement = await namedCounter.locator('.increment');
		await namedIncrement.click();

		await expect(namedCount, 'count incremented by 1').toHaveText('1');
	});

	test('MDX', async ({ page }) => {
		await page.goto('/mdx');

		// Counter declared with: <ns.components.PreactCounter id="preact-counter-namespace" client:load>
		const namespacedCounter = await page.locator('#preact-counter-namespace');
		await expect(namespacedCounter, 'component is visible').toBeVisible();

		const namespacedCount = await namespacedCounter.locator('pre');
		await expect(namespacedCount, 'initial count is 0').toHaveText('0');

		const namespacedChildren = await namespacedCounter.locator('.children');
		await expect(namespacedChildren, 'children exist').toHaveText('preact (namespace import)');

		const namespacedIncrement = await namespacedCounter.locator('.increment');
		await namespacedIncrement.click();

		await expect(namespacedCount, 'count incremented by 1').toHaveText('1');

		// Counter declared with: <components.PreactCounterTwo id="preact-counter-named" client:load>
		const namedCounter = await page.locator('#preact-counter-named');
		await expect(namedCounter, 'component is visible').toBeVisible();

		const namedCount = await namedCounter.locator('pre');
		await expect(namedCount, 'initial count is 0').toHaveText('0');

		const namedChildren = await namedCounter.locator('.children');
		await expect(namedChildren, 'children exist').toHaveText('preact (named import)');

		const namedIncrement = await namedCounter.locator('.increment');
		await namedIncrement.click();

		await expect(namedCount, 'count incremented by 1').toHaveText('1');
	});
});
