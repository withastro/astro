import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectComponentAssets } from '@astrojs/runtime/_internal/server/render/component-assets.js';
import type { SSRComponentMetadata, SSRResult } from '../../../dist/types/public/internal.js';

function createResult(metadata: Map<string, SSRComponentMetadata>) {
	return { styles: new Set(), componentMetadata: metadata, _metadata: {} } as unknown as SSRResult;
}

function createMetadata(): SSRComponentMetadata {
	return {
		propagation: 'none',
		containsHead: false,
		assets: {
			styles: [
				{ type: 'inline', content: '.shared{color:red}', viteDevId: '/shared.css' },
				{ type: 'external', src: '/shared.css' },
			],
			scripts: [{ props: { type: 'module', src: '/shared.css' }, children: '' }],
		},
	};
}

describe('component assets', () => {
	it('ignores unknown components without initializing request state', () => {
		const result = createResult(new Map());
		assert.equal(collectComponentAssets(result, undefined), '');
		assert.equal(collectComponentAssets(result, '/missing.astro'), '');
		assert.equal(result._metadata.componentAssets, undefined);
	});

	it('deduplicates shared assets by value across components and repeated renders', () => {
		const metadata = new Map([
			['/one.astro', createMetadata()],
			['/two.astro', createMetadata()],
		]);
		const result = createResult(metadata);
		const html = collectComponentAssets(result, '/one.astro');
		assert.match(html, /<style data-vite-dev-id="\/shared.css">/);
		assert.match(html, /<link rel="stylesheet" href="\/shared.css">/);
		assert.match(html, /<script type="module" src="\/shared.css"><\/script>/);
		assert.equal(collectComponentAssets(result, '/one.astro'), '');
		assert.equal(collectComponentAssets(result, '/two.astro'), '');
		assert.equal(collectComponentAssets(createResult(metadata), '/two.astro'), html);
	});

	it('omits styles already present in the page head', () => {
		const result = createResult(new Map([['/one.astro', createMetadata()]]));
		result.styles.add({ props: {}, children: '.shared{color:red}' });
		result.styles.add({ props: { rel: 'stylesheet', href: '/shared.css' }, children: '' });
		assert.equal(
			collectComponentAssets(result, '/one.astro'),
			'<script type="module" src="/shared.css"></script>',
		);
	});
});
