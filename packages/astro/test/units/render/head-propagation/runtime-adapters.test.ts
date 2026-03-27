import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SSRResult } from '../../../../dist/types/public/internal.js';
import { createAstroComponentInstance } from '../../../../dist/runtime/server/render/astro/instance.js';
import { bufferHeadContent } from '../../../../dist/runtime/server/render/astro/render.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

function createResult() {
	return {
		clientDirectives: new Map(),
		componentMetadata: new Map<string, { propagation: string; containsHead: boolean }>(),
		partial: false,
		_metadata: {
			hasRenderedHead: false,
			headInTree: false,
			propagators: new Set<{ init: () => unknown }>(),
			extraHead: [] as string[],
		},
	} as unknown as SSRResult;
}

describe('head propagation runtime adapters', () => {
	it('createAstroComponentInstance registers propagation via metadata fallback', () => {
		const result = createResult();
		(result as unknown as { componentMetadata: Map<string, unknown> }).componentMetadata.set(
			'/src/Comp.astro',
			{
				propagation: 'in-tree',
				containsHead: false,
			},
		);

		createAstroComponentInstance(
			result,
			'Comp',
			Object.assign(() => null, {
				moduleId: '/src/Comp.astro',
				propagation: 'none',
			}) as any,
			{},
			{},
		);

		assert.equal(
			(result as unknown as { _metadata: { propagators: Set<unknown> } })._metadata.propagators
				.size,
			1,
		);
	});

	it('bufferHeadContent pushes propagated heads to extraHead', async () => {
		const result = createResult();
		(
			result as unknown as { _metadata: { propagators: Set<{ init: () => unknown }> } }
		)._metadata.propagators.add({
			init() {
				return {
					[headAndContentSym]: true,
					head: '<style>.from-adapter{color:rebeccapurple}</style>',
				};
			},
		});

		await bufferHeadContent(result);
		assert.deepEqual(
			(result as unknown as { _metadata: { extraHead: string[] } })._metadata.extraHead,
			['<style>.from-adapter{color:rebeccapurple}</style>'],
		);
	});
});
