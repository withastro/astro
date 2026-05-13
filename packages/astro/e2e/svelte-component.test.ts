import { expect } from '@playwright/test';
import { prepareTestFactory } from './shared-component-tests.ts';
import { waitForHydrate } from './test-utils.ts';

const { test, createTests } = prepareTestFactory(import.meta.url, {
	root: './fixtures/svelte-component/',
});

const config = {
	componentFilePath: './src/components/SvelteComponent.svelte',
	counterComponentFilePath: './src/components/Counter.svelte',
	counterCssFilePath: './src/components/Counter.svelte',
};

// TODO: Re-enable once Svelte is compatible with Vite v8
test.describe
	.skip('Svelte components in Astro files', () => {
		createTests({
			...config,
			pageUrl: '/',
			pageSourceFilePath: './src/pages/index.astro',
		});
	});

// TODO: Re-enable once Svelte is compatible with Vite v8
test.describe
	.skip('Svelte components in MDX files', () => {
		createTests({
			...config,
			pageUrl: '/mdx/',
			pageSourceFilePath: './src/pages/mdx.mdx',
		});
	});

// TODO: Re-enable once Svelte is compatible with Vite v8
test.describe
	.skip('Svelte components lifecycle', () => {
		test('slot should unmount properly', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const toggle = page.locator('#toggle');
			expect((await toggle.textContent())!.trim()).toBe('close');
			await toggle.click();
			expect((await toggle.textContent())!.trim()).toBe('open');
		});
	});

// TODO: Re-enable once Svelte is compatible with Vite v8
test.describe
	.skip('Slotting content into svelte components', () => {
		test('should stay after hydration', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/with-slots'));
			const hydratableElement = page.locator('#hydratable');
			await waitForHydrate(page, hydratableElement);
			await expect(hydratableElement).toHaveText('Slot goes here:poo');
		});
	});
