import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAstroComponentInstance } from '../../../../dist/runtime/server/render/astro/instance.js';
import { bufferHeadContent } from '../../../../dist/runtime/server/render/astro/render.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

function createResult() {
	return {
		clientDirectives: new Map(),
		componentMetadata: new Map(),
		partial: false,
		_metadata: {
			hasRenderedHead: false,
			headInTree: false,
			propagators: new Set(),
			extraHead: [],
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
			result,
			'Comp',
			Object.assign(() => null, {
				moduleId: '/src/Comp.astro',
				propagation: 'none',
			}),
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

		await bufferHeadContent(result);
		assert.deepEqual(result._metadata.extraHead, [
			'<style>.from-adapter{color:rebeccapurple}</style>',
		]);
	});
});
