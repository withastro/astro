import { expect } from '@playwright/test';
import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/svelte-component/' });

const config = {
	componentFilePath: './src/components/SvelteComponent.svelte',
	counterComponentFilePath: './src/components/Counter.svelte',
	counterCssFilePath: './src/components/Counter.svelte',
};

test.describe('Svelte components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('Svelte components in MDX files', () => {
	createTests({
		...config,
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
	});
});

test.describe('Svelte components lifecycle', () => {
	test('slot should unmount properly', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const toggle = page.locator('#toggle');
		expect((await toggle.textContent()).trim()).toBe('close');
		await toggle.click();
		expect((await toggle.textContent()).trim()).toBe('open');
	});
});
