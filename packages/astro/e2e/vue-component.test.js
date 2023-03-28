import { prepareTestFactory } from './shared-component-tests.js';
import { expect } from '@playwright/test';
const { test, createTests } = prepareTestFactory({ root: './fixtures/vue-component/' });

const config = {
	componentFilePath: './src/components/VueComponent.vue',
	counterCssFilePath: './src/components/Counter.vue',
	counterComponentFilePath: './src/components/Counter.vue',
};

test.describe('Vue components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('Vue components in MDX files', () => {
	createTests({
		...config,
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
	});
});


test('test the async vue component in astro', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const label = page.locator('#client-test');

		await expect(label, 'component not hydrated').toHaveText('2');
});

test('test the async vue component in mdx', async ({ page, astro }) => {
	await page.goto(astro.resolveUrl('/mdx/'));

	const label = page.locator('#client-test');

	await expect(label, 'component not hydrated').toHaveText('2');
});
