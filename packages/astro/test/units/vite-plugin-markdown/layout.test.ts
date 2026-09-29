import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { Plugin } from 'vite';
import { astroContentAssetPropagationPlugin } from '../../../dist/content/vite-plugin-content-assets.js';
import markdown from '../../../dist/vite-plugin-markdown/index.js';
import { createBasicSettings, createFixture, defaultLogger } from '../test-utils.ts';

type Fixture = Awaited<ReturnType<typeof createFixture>>;

async function callHook(plugin: Plugin, hook: 'load' | 'transform', ctx: object, ...args: any[]) {
	const handler = (plugin[hook] as any).handler;
	return await handler.call(ctx, ...args);
}

describe('Markdown layout frontmatter', () => {
	let fixture: Fixture;
	let settings: Awaited<ReturnType<typeof createBasicSettings>>;
	let plugin: Plugin;
	let filePath: string;

	before(async () => {
		fixture = await createFixture({
			'src/content/blog/post.md': '---\ntitle: Post\nlayout: demo\n---\n\n# Hello',
		});
		settings = await createBasicSettings({ root: fixture.path });
		plugin = markdown({ settings, logger: defaultLogger });
		filePath = fixture.getPath('src/content/blog/post.md').replaceAll('\\', '/');
	});

	after(async () => {
		await fixture.rm();
	});

	it('imports the layout for direct Markdown imports', async () => {
		const result = await callHook(plugin, 'load', {}, filePath);
		assert.match(result.code, /import Layout from "demo";/);
	});

	it('ignores the layout for content collection entries rendered with deferRender', async () => {
		const propagation = astroContentAssetPropagationPlugin({ settings });
		const wrapper = await callHook(
			propagation,
			'transform',
			{ environment: { name: 'client' } },
			'',
			`${filePath}?astroPropagatedAssets`,
		);
		const importedId = wrapper.code.match(/return import\("([^"]+)"\)/)?.[1];
		assert.ok(importedId);
		assert.notEqual(importedId, filePath);

		const result = await callHook(plugin, 'load', {}, importedId);
		assert.doesNotMatch(result.code, /import Layout/);
		assert.match(result.code, /Hello/);
	});
});
