import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/multiple-frameworks/' });

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

	test.describe('HMR', () => {
		test('Page template', async ({ astro, page }) => {
			await page.goto('/');

			const slot = page.locator('#preact-counter + .counter-message');
			await expect(slot, 'initial slot content').toHaveText('Hello Preact!');

			await astro.editFile('./src/pages/index.astro', (content) =>
				content.replace('Hello Preact!', 'Hello Preact, updated!')
			);

			await expect(slot, 'slot content updated').toHaveText('Hello Preact, updated!');
		});

		test('React component', async ({ astro, page }) => {
			await page.goto('/');

			const count = await page.locator('#react-counter pre');
			await expect(count, 'initial count updated to 0').toHaveText('0');

			await astro.editFile('./src/components/ReactCounter.jsx', (content) =>
				content.replace('useState(0)', 'useState(5)')
			);

			await expect(count, 'initial count updated to 5').toHaveText('5');
		});

		test('Preact component', async ({ astro, page }) => {
			await page.goto('/');

			const count = await page.locator('#preact-counter pre');
			await expect(count, 'initial count updated to 0').toHaveText('0');

			await astro.editFile('./src/components/PreactCounter.tsx', (content) =>
				content.replace('useState(0)', 'useState(5)')
			);

			await expect(count, 'initial count updated to 5').toHaveText('5');
		});

		test('Solid component', async ({ astro, page }) => {
			await page.goto('/');

			const count = await page.locator('#solid-counter pre');
			await expect(count, 'initial count updated to 0').toHaveText('0');

			await astro.editFile('./src/components/SolidCounter.tsx', (content) =>
				content.replace('createSignal(0)', 'createSignal(5)')
			);

			await expect(count, 'initial count updated to 5').toHaveText('5');
		});

		// TODO: re-enable this test when #3559 is fixed
		// https://github.com/withastro/astro/issues/3559
		test.skip('Vue component', async ({ astro, page }) => {
			await page.goto('/');

			const count = await page.locator('#vue-counter pre');
			await expect(count, 'initial count updated to 0').toHaveText('0');

			await astro.editFile('./src/components/VueCounter.vue', (content) =>
				content.replace('ref(0)', 'ref(5)')
			);

			await expect(count, 'initial count updated to 5').toHaveText('5');
		});

		// TODO: track down a reliability issue in this test
		// It seems to lost connection to the vite server in CI
		test.skip('Svelte component', async ({ astro, page }) => {
			await page.goto('/');

			const count = page.locator('#svelte-counter pre');
			await expect(count, 'initial count is 0').toHaveText('0');

			await astro.editFile('./src/components/SvelteCounter.svelte', (content) =>
				content.replace('let count = 0;', 'let count = 5;')
			);

			await expect(count, 'initial count updated to 5').toHaveText('5');
		});
	});
});
