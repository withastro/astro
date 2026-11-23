import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compileFixture } from '@astrojs/runtime/_internal/test/compile-fixture';
import { expect, type Page, test } from '@playwright/test';
import { rolldown } from 'rolldown';

async function bundleFixtureToModuleUrl(page: Page, define?: Record<string, string>) {
	const bundle = await rolldown({
		input: fileURLToPath(new URL('./fixtures/runtime-client/entry.js', import.meta.url)),
		platform: 'neutral',
		resolve: { mainFields: ['module', 'main'] },
		transform: { define },
		plugins: [
			{
				name: 'compile-astro-fixture',
				load: {
					filter: { id: /\.astro$/ },
					async handler(filename) {
						return compileFixture(await readFile(filename, 'utf8'), filename);
					},
				},
			},
		],
	});
	try {
		const { output } = await bundle.generate({ format: 'esm' });
		return await page.evaluate(
			(code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' })),
			output[0].code,
		);
	} finally {
		await bundle.close();
	}
}

test('renders props, a slot, and a framework island in the browser', async ({ page }) => {
	await page.evaluate(
		async (url) => {
			const { Message, renderer } = await import(url);
			document.body.innerHTML = await renderer.renderToString(Message, {
				partial: true,
				props: { title: 'Hello from the browser' },
				slots: { default: '<strong>Slotted content</strong>' },
			});
		},
		await bundleFixtureToModuleUrl(page),
	);

	await expect(page.getByRole('heading')).toHaveText('Hello from the browser');
	await expect(page.locator('strong')).toHaveText('Slotted content');
	const island = page.locator('astro-island[client="load"]');
	await expect(island.locator('b')).toHaveText('2');
	await expect(island).toHaveAttribute('renderer-url', '/widget-client.js');
});

test('renders an HTML Response for a browser Request', async ({ page }) => {
	const result = await page.evaluate(
		async (url) => {
			const { Message, renderer } = await import(url);
			const response = await renderer.renderToResponse(Message, {
				request: new Request('https://example.com/messages/42'),
			});
			return {
				isResponse: response instanceof Response,
				contentType: response.headers.get('Content-Type'),
				html: await response.text(),
			};
		},
		await bundleFixtureToModuleUrl(page),
	);

	expect(result.isResponse).toBe(true);
	expect(result.contentType).toBe('text/html');
	expect(result.html).toMatch(/^<!DOCTYPE html>/);
	expect(result.html).toContain('<p>/messages/42</p>');
});

test('includes island diagnostics when the bundle defines development mode without process', async ({
	page,
}) => {
	const developmentModuleUrl = await bundleFixtureToModuleUrl(page, {
		'process.env.NODE_ENV': '"development"',
	});
	await page.evaluate(async (url) => {
		const { Message, renderer } = await import(url);
		document.body.innerHTML = await renderer.renderToString(Message, { partial: true });
	}, developmentModuleUrl);

	await expect(page.locator('astro-island')).toHaveAttribute('server-render-time', /^\d+(\.\d+)?$/);
	expect((await page.locator('script').allTextContents()).join('\n')).toContain(
		'client-render-time',
	);
});
