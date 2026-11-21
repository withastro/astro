import { expect } from '@playwright/test';
import { type PreviewServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/react-children/' });

let previewServer: PreviewServer;

test.beforeAll(async ({ astro }) => {
	await astro.build();
	previewServer = await astro.preview();
});

test.afterAll(async () => {
	await previewServer?.stop();
});

test('experimentalReactChildren hydrates text children without a mismatch', async ({
	page,
	astro,
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(astro.resolveUrl('/'));
	await expect(page.locator('#pre-leading-line-break')).toHaveAttribute('data-hydrated', 'true');
	await expect(page.locator('#pre-leading-line-break-text')).toHaveAttribute(
		'data-hydrated',
		'true',
	);
	const expectedText = {
		text: 'Hello world',
		space: 'Hello world',
		'top-level-space': 'Hello world',
		pre: 'A\nB',
		count: '2',
	};
	for (const [id, text] of Object.entries(expectedText)) {
		const box = page.locator(`#${id}`);
		await expect(box).toHaveAttribute('data-hydrated', 'true');
		expect(await box.textContent()).toBe(text);
	}
	expect(errors).toEqual([]);
});
