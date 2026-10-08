import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { astroContentAssetPropagationPlugin } from '../../../dist/content/vite-plugin-content-assets.js';
import { createBasicSettings } from '../test-utils.ts';

describe('astro:content-asset-propagation transform', () => {
	async function transform(id: string) {
		const settings = await createBasicSettings();
		const plugin = astroContentAssetPropagationPlugin({ settings }) as any;
		return plugin.transform.handler.call({ environment: { name: 'client' } }, '', id);
	}

	it('imports Markdown entries with the content entry query', async () => {
		const { code } = await transform('/src/content/post.md?astroPropagatedAssets');
		assert.match(code, /import\("\/src\/content\/post\.md\?astroMarkdownContentEntry"\)/);
	});

	it('imports non-Markdown entries by their bare path', async () => {
		const { code } = await transform('/src/content/post.mdx?astroPropagatedAssets');
		assert.match(code, /import\("\/src\/content\/post\.mdx"\)/);
	});
});
