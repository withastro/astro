import { expect } from '@playwright/test';
import { prepareTestFactory } from './shared-component-tests.js';

const { test } = prepareTestFactory(import.meta.url, {
	root: './fixtures/react-context-sharing/',
});

test.describe('React Context Sharing', () => {
	test.describe('With shared context feature', () => {
		test('island outside provider should still NOT have context', async ({
			page,
			astro,
		}) => {
			await page.goto(astro.resolveUrl('/'));

			const consumer = page.locator('[data-theme-consumer="outside"]:not([data-original-ssr])');
			await expect(consumer).toHaveAttribute('data-has-context', 'false');
			await expect(consumer).toContainText('Current theme: light');
		});

		test('nested island inside provider SHOULD have context', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const consumer = page.locator('[data-theme-consumer="nested"]:not([data-original-ssr])');
			await expect(consumer).toHaveAttribute('data-has-context', 'true');
			await expect(consumer).toContainText('Current theme: light');
		});

		test('sibling islands inside provider SHOULD share context', async ({
			page,
			astro,
		}) => {
			await page.goto(astro.resolveUrl('/'));

			// Get the specific section for Test 3
			const section = page.locator('section').filter({ hasText: 'Test 3: Multiple islands inside provider' });
			const consumer1 = section.locator('[data-theme-consumer="sibling-1"]:not([data-original-ssr])');
			const consumer2 = section.locator('[data-theme-consumer="sibling-2"]:not([data-original-ssr])');
			const toggle = section.locator('[data-theme-toggle]:not([data-original-ssr])');

			// Both should have context
			await expect(consumer1).toHaveAttribute('data-has-context', 'true');
			await expect(consumer2).toHaveAttribute('data-has-context', 'true');

			// Both should show 'light' initially
			await expect(consumer1).toContainText('Current theme: light');
			await expect(consumer2).toContainText('Current theme: light');

			// Click toggle to change theme
			await toggle.click();

			// Both should update to 'dark'
			await expect(consumer1).toContainText('Current theme: dark');
			await expect(consumer2).toContainText('Current theme: dark');
		});

		test('deeply nested island SHOULD have context', async ({ page, astro }) => {
			await page.goto(astro.resolveUrl('/'));

			const consumer = page.locator('[data-theme-consumer="deep-nested"]:not([data-original-ssr])');
			await expect(consumer).toHaveAttribute('data-has-context', 'true');
			await expect(consumer).toContainText('Current theme: light');
		});

		test('theme changes should propagate to all nested consumers', async ({
			page,
			astro,
		}) => {
			await page.goto(astro.resolveUrl('/'));

			const nestedConsumer = page.locator('[data-theme-consumer="nested"]:not([data-original-ssr])');
			const toggle = page.locator('[data-theme-toggle]:not([data-original-ssr])').first();

			await expect(nestedConsumer).toContainText('Current theme: light');

			await toggle.click();
			await expect(nestedConsumer).toContainText('Current theme: dark');

			await toggle.click();
			await expect(nestedConsumer).toContainText('Current theme: light');
		});
	});
});
