import { expect } from '@playwright/test';
import { type PreviewServer, testFactory } from './test-utils.ts';

// Keep the fixture under this package so prerender output stays beside its dependencies.
const test = testFactory(import.meta.url, {
	root: './fixtures/react-resource-links/',
});
let previewServer: PreviewServer;
test.beforeAll(async ({ astro }) => {
	await astro.build();
	previewServer = await astro.preview();
});
test.afterAll(async () => {
	await previewServer?.stop();
});

test('authored resource links style the island without JavaScript', async ({ browser, astro }) => {
	const page = await browser.newPage({ javaScriptEnabled: false });
	try {
		await page.goto(astro.resolveUrl('/'));
		await expect(page.locator('#widget')).toHaveCSS('color', 'rgb(128, 0, 128)');
		for (const rel of ['stylesheet', 'preconnect', 'dns-prefetch', 'preload', 'modulepreload']) {
			await expect(page.locator(`astro-island link[rel="${rel}"]`).first()).toBeAttached();
		}
	} finally {
		await page.close();
	}
});

test('resource links and automatic image hints hydrate without recovering the island', async ({
	page,
	astro,
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error' && /hydrat|#418|#423/i.test(message.text()))
			errors.push(message.text());
	});
	await page.addInitScript(() => {
		new MutationObserver(() => {
			const button = document.querySelector('#widget');
			if (button && !(window as any).serverWidget) (window as any).serverWidget = button;
		}).observe(document, { childList: true, subtree: true });
	});
	await page.goto(astro.resolveUrl('/'));
	await expect(page.locator('astro-island')).not.toHaveAttribute('ssr');
	await page.locator('#widget').click();
	await expect(page.locator('#widget')).toHaveText('Hydrated');
	expect(
		await page.evaluate(() => (window as any).serverWidget === document.querySelector('#widget')),
	).toBe(true);
	expect(errors).toEqual([]);
});
