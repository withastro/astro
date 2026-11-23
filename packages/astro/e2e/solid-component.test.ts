import { expect } from '@playwright/test';
import { prepareTestFactory } from './shared-component-tests.ts';
import { waitForHydrate } from './test-utils.ts';

const { test, createTests } = prepareTestFactory(import.meta.url, {
	root: './fixtures/solid-component/',
});

const config = {
	componentFilePath: './src/components/SolidComponent.jsx',
	counterComponentFilePath: './src/components/Counter.jsx',
};

test.describe('Solid components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('Solid components in MDX files', () => {
	createTests({
		...config,
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
	});
});

test.describe('Solid islands hydrating after another island', () => {
	test('adopt their server-rendered DOM', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await waitForHydrate(page, page.locator('#client-load'));
		// Solid marks the page-wide hydration as done shortly after the first island hydrates.
		await page.waitForFunction(() => (globalThis as any)._$HY?.done === true);

		const counter = page.locator('#client-media');
		const serverElement = await counter.elementHandle();

		await page.setViewportSize({ width: 414, height: 1124 });
		await waitForHydrate(page, counter);

		expect(
			await serverElement!.evaluate((el) => el.isConnected),
			'server-rendered element is kept',
		).toBe(true);
		await counter.locator('.increment').click();
		await expect(counter.locator('pre'), 'count incremented by 1').toHaveText('1');
	});
});
