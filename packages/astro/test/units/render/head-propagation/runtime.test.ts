import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroComponentInstance } from '../../../../dist/runtime/server/render/astro/instance.js';
import {
	bufferPropagatedHead,
	getInstructionRenderState,
	registerIfPropagating,
	shouldRenderInstruction,
} from '../../../../dist/runtime/server/render/head-propagation/runtime.js';
import { createMockResult } from '../../mocks.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

/** Creates a stub AstroComponentInstance whose init() returns the given value. */
function stubPropagator(initResult: unknown): AstroComponentInstance {
	return { init: () => initResult } as unknown as AstroComponentInstance;
}

describe('head propagation runtime facade', () => {
	it('registers only propagating components', () => {
		const result = createMockResult();
		registerIfPropagating(result, { propagation: 'none' } as any, stubPropagator(null));
		assert.equal(result._metadata.propagators.size, 0);

		registerIfPropagating(result, { propagation: 'self' } as any, stubPropagator(null));
		assert.equal(result._metadata.propagators.size, 1);
	});

	it('buffers propagated head output into extraHead', async () => {
		const result = createMockResult();
		result._metadata.propagators.add(
			stubPropagator({
				[headAndContentSym]: true,
				head: '<link rel="stylesheet" href="/one.css">',
			}),
		);

		await bufferPropagatedHead(result);
		assert.deepEqual(result._metadata.extraHead, ['<link rel="stylesheet" href="/one.css">']);
	});

	it('exposes render state and evaluates instruction policy', () => {
		const result = createMockResult();
		const state = getInstructionRenderState(result);
		assert.deepEqual(state, {
			hasRenderedHead: false,
			headInTree: false,
			partial: false,
		});
		assert.equal(shouldRenderInstruction('head', state), true);
		assert.equal(shouldRenderInstruction('maybe-head', state), true);
	});
});
