import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectComponentAssets } from '@astrojs/runtime/_internal/server/render/component-assets.js';
import { renderAllHeadContent } from '@astrojs/runtime/_internal/server/render/head.js';
import type { SSRComponentMetadata, SSRResult } from '../../../dist/types/public/internal.js';

function createResult(metadata: Map<string, SSRComponentMetadata>) {
	return {
		styles: new Set(),
		scripts: new Set(),
		links: new Set(),
		componentMetadata: metadata,
		_metadata: { hasRenderedHead: true, extraHead: [] },
	} as unknown as SSRResult;
}

function createMetadata(): SSRComponentMetadata {
	return {
		propagation: 'none',
		containsHead: false,
		assets: {
			order: 0,
			styles: [
				{ type: 'inline', content: '.shared{color:red}', viteDevId: '/shared.css', order: 0 },
				{ type: 'external', src: '/shared.css', order: 1 },
			],
			scripts: [{ props: { type: 'module', src: '/shared.css' }, children: '' }],
		},
	};
}

describe('component assets', () => {
	it('emits partial-response assets without waiting for a head', () => {
		const result = createResult(new Map([['/one.astro', createMetadata()]]));
		result.partial = true;
		result._metadata.hasRenderedHead = false;
		const html = collectComponentAssets(result, '/one.astro');
		assert.match(html, /<style/);
		assert.match(html, /<link/);
		assert.match(html, /<script/);
		assert.equal(result._metadata.componentAssets!.pending.length, 0);
		assert.equal(collectComponentAssets(result, '/one.astro'), '');
	});
	it('flushes early assets in dependency order and emits late assets directly', () => {
		const parent = createMetadata();
		parent.assets!.styles = [{ type: 'inline', content: '.parent{}', order: 2 }];
		parent.assets!.scripts = [];
		const child = createMetadata();
		child.assets!.styles = [{ type: 'inline', content: '.child{}', order: 1 }];
		child.assets!.scripts = [];
		const result = createResult(
			new Map([
				['parent', parent],
				['child', child],
				['late', createMetadata()],
			]),
		);
		result._metadata.hasRenderedHead = false;
		assert.equal(collectComponentAssets(result, 'parent'), '');
		assert.equal(collectComponentAssets(result, 'child'), '');
		assert.equal(
			String(renderAllHeadContent(result)),
			'<style>.child{}</style>\n<style>.parent{}</style>',
		);
		assert.equal(result._metadata.componentAssets!.pending.length, 0);
		assert.equal(collectComponentAssets(result, 'parent'), '');
		assert.match(collectComponentAssets(result, 'late'), /shared/);
	});
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
