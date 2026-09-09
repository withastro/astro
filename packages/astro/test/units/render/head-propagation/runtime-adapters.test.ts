import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAstroComponentInstance } from '../../../../dist/runtime/server/render/astro/instance.js';
import { bufferHeadContent } from '../../../../dist/runtime/server/render/astro/render.js';
import type { SSRResult } from '../../../../dist/types/public/internal.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

function createResult() {
	return {
		clientDirectives: new Map(),
		componentMetadata: new Map<string, { propagation: string; containsHead: boolean }>(),
		partial: false,
		_metadata: {
			hasRenderedHead: false,
			headInTree: false,
			propagators: new Set(),
			extraHead: [] as string[],
		},
	};
}

describe('head propagation runtime adapters', () => {
	it('createAstroComponentInstance registers propagation via metadata fallback', () => {
		const result = createResult();
		result.componentMetadata.set('/src/Comp.astro', {
			propagation: 'in-tree',
			containsHead: false,
		});

		createAstroComponentInstance(
			result as unknown as SSRResult,
			'Comp',
			Object.assign((() => null) as () => null, {
				moduleId: '/src/Comp.astro',
				propagation: 'none' as const,
			}) as unknown as Parameters<typeof createAstroComponentInstance>[2],
			{},
			{},
		);

		assert.equal(result._metadata.propagators.size, 1);
	});

	it('bufferHeadContent pushes propagated heads to extraHead', async () => {
		const result = createResult();
		result._metadata.propagators.add({
			init() {
				return {
					[headAndContentSym]: true,
					head: '<style>.from-adapter{color:rebeccapurple}</style>',
				};
			},
		});

		await bufferHeadContent(result as unknown as SSRResult);
		assert.deepEqual(result._metadata.extraHead, [
			'<style>.from-adapter{color:rebeccapurple}</style>',
		]);
	});
});
