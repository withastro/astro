import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SSRResult } from '../../../dist/types/public/internal.js';
import { renderUniqueStylesheet } from '../../../dist/runtime/server/render/tags.js';

function createResult() {
	return { styles: new Set() } as unknown as SSRResult;
}

describe('renderUniqueStylesheet', () => {
	it('renders inline style without attributes by default', () => {
		const result = createResult();
		const output = renderUniqueStylesheet(result, {
			type: 'inline',
			content: '.foo { color: red; }',
		});
		assert.equal(output, '<style>.foo { color: red; }</style>');
	});

	it('renders inline style with data-vite-dev-id when viteDevId is provided', () => {
		const result = createResult();
		const output = renderUniqueStylesheet(result, {
			type: 'inline',
			content: '.bar { color: blue; }',
			viteDevId: '/src/components/Bar.svelte?svelte&type=style&lang.css',
		});
		assert.equal(
			output,
			'<style data-vite-dev-id="/src/components/Bar.svelte?svelte&amp;type=style&amp;lang.css">.bar { color: blue; }</style>',
		);
	});

	it('omits data-vite-dev-id when viteDevId is undefined', () => {
		const result = createResult();
		const output = renderUniqueStylesheet(result, {
			type: 'inline',
			content: '.baz { color: green; }',
			viteDevId: undefined,
		});
		assert.equal(output, '<style>.baz { color: green; }</style>');
	});
});
