import { expect } from '@playwright/test';
import { prepareTestFactory } from './shared-component-tests.js';

const { test, createTests } = prepareTestFactory({ root: './fixtures/react-component/' });

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

test.describe('React components in Markdown files', () => {
	createTests({
		...config,
		pageUrl: '/markdown/',
		pageSourceFilePath: './src/pages/markdown.md',
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
