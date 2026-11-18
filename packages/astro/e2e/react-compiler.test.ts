import { expect } from '@playwright/test';
import { testFactory, waitForHydrate, type DevServer, type PreviewServer } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/react-compiler/' });

test.describe('React Compiler dev', () => {
	let server: DevServer;
	test.beforeAll(async ({ astro }) => {
		server = await astro.startDevServer();
	});
	test.afterAll(async () => {
		await server?.stop();
	});
	test('hydrates and preserves state through Fast Refresh', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/'));
		await expect(page.locator('html')).toHaveAttribute('data-status', 'ready');
		const button = page.getByRole('button');
		await waitForHydrate(page, button);
		await button.click();
		await expect(button).toHaveText('Count: 1');
		await astro.editFile('./src/components/Counter.jsx', (source) =>
			source.replace('{label}:', '{label} updated:'),
		);
		await expect(button).toHaveText('Count updated: 1');
		await button.click();
		await expect(button).toHaveText('Count updated: 2');
	});
});

test.describe('React Compiler build', () => {
	let server: PreviewServer;
	test.beforeAll(async ({ astro }) => {
		await astro.build();
		server = await astro.preview();
	});
	test.afterAll(async () => {
		await server?.stop();
	});
	test('hydrates the compiled production island', async ({ astro, page }) => {
		await page.goto(astro.resolveUrl('/'));
		await expect(page.locator('html')).toHaveAttribute('data-status', 'ready');
		const button = page.getByRole('button');
		await waitForHydrate(page, button);
		await button.click();
		await expect(button).toHaveText('Count: 1');
	});
});
