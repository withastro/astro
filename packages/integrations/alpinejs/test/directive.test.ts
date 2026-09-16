import { expect } from '@playwright/test';
import { prepareTestFactory } from './test-utils.js';

const { test } = prepareTestFactory({ root: './fixtures/directive/' });

test.describe('Directive', () => {
	test('Alpine is working', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const el = page.locator('#foo');
		await expect(el).toHaveText('bar');
	});
});
