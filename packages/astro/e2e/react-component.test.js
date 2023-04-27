import { expect } from '@playwright/test';
import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: new URL('./fixtures/react-component/', import.meta.url) });

const config = {
	counterComponentFilePath: './src/components/Counter.jsx',
	componentFilePath: './src/components/JSXComponent.jsx',
};

test.describe('React components in Astro files', () => {
	createTests({
		...config,
		pageUrl: '/',
		pageSourceFilePath: './src/pages/index.astro',
	});
});

test.describe('React components in MDX files', () => {
	createTests({
		...config,
		pageUrl: '/mdx/',
		pageSourceFilePath: './src/pages/mdx.mdx',
	});
});

test.describe('dev', () => {
	test('Loads .react suffix', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const suffix = page.locator('#suffix');
		expect(await suffix.textContent()).toBe('suffix toggle false');
		await suffix.click();
		expect(await suffix.textContent()).toBe('suffix toggle true');
	});
});
