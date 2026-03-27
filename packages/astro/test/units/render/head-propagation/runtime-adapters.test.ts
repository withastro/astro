import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroComponentInstance } from '../../../../dist/runtime/server/render/astro/instance.js';
import { createAstroComponentInstance } from '../../../../dist/runtime/server/render/astro/instance.js';
import { bufferHeadContent } from '../../../../dist/runtime/server/render/astro/render.js';
import { createMockResult } from '../../mocks.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

/** Creates a stub AstroComponentInstance whose init() returns the given value. */
function stubPropagator(initResult: unknown): AstroComponentInstance {
	return { init: () => initResult } as unknown as AstroComponentInstance;
}

describe('head propagation runtime adapters', () => {
	it('createAstroComponentInstance registers propagation via metadata fallback', () => {
		const result = createMockResult();
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
			}) as any,
			{},
			{},
		);

		assert.equal(result._metadata.propagators.size, 1);
	});

	it('bufferHeadContent pushes propagated heads to extraHead', async () => {
		const result = createMockResult();
		result._metadata.propagators.add(
			stubPropagator({
				[headAndContentSym]: true,
				head: '<style>.from-adapter{color:rebeccapurple}</style>',
			}),
		);

		await bufferHeadContent(result);
		assert.deepEqual(result._metadata.extraHead, [
			'<style>.from-adapter{color:rebeccapurple}</style>',
		]);
	});
});
