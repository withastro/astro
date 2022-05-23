import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/multiple-frameworks/' });
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

test.describe('Multiple frameworks', () => {
	test('React counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#react-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('.increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Preact counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#preact-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('.increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Solid counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#solid-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('.increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Vue counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#vue-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('.increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Svelte counter', async ({ astro, page }) => {
		await page.goto('/');

		const counter = await page.locator('#svelte-counter');
		await expect(counter, 'component is visible').toBeVisible();

		const count = await counter.locator('pre');
		await expect(count, 'initial count is 0').toHaveText('0');

		const increment = await counter.locator('.increment');
		await increment.click();

		await expect(count, 'count incremented by 1').toHaveText('1');
	});

	test('Astro components', async ({ astro, page }) => {
		await page.goto('/');

		const aComponent = await page.locator('#astro-a');
		await expect(aComponent, 'component is visible').toBeVisible();
		await expect(aComponent, 'component text is visible').toHaveText('Hello Astro (A)');

		const bComponent = await page.locator('#astro-b');
		await expect(bComponent, 'component is visible').toBeVisible();
		await expect(bComponent, 'component text is visible').toHaveText('Hello Astro (B)');
	});

	test('HMR', async ({ astro, page }) => {
		await page.goto('/');

		// 1: updating the page template
		const preactSlot = page.locator('#preact-counter + .counter-message');
		await expect(preactSlot, 'initial slot content').toHaveText('Hello Preact!');

		await astro.editFile('./src/pages/index.astro', (content) =>
			content.replace('Hello Preact!', 'Hello Preact, updated!')
		);

		await expect(preactSlot, 'slot content updated').toHaveText('Hello Preact, updated!');

		// Edit the react component
		await astro.editFile('./src/components/ReactCounter.jsx', (content) =>
			content.replace('useState(0)', 'useState(5)')
		);

		const reactCount = await page.locator('#react-counter pre');
		await expect(reactCount, 'initial count updated to 5').toHaveText('5');

		// Edit the svelte component's style
		const svelteCounter = page.locator('#svelte-counter');
		await expect(svelteCounter, 'initial background is white').toHaveCSS(
			'background-color',
			'rgb(255, 255, 255)'
		);

		await astro.editFile('./src/components/SvelteCounter.svelte', (content) =>
			content.replace('background: white', 'background: rgb(230, 230, 230)')
		);

		await expect(svelteCounter, 'background color updated').toHaveCSS(
			'background-color',
			'rgb(230, 230, 230)'
		);
	});
});
