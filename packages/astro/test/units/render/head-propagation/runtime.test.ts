import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SSRResult } from '../../../../dist/types/public/internal.js';
import {
	bufferPropagatedHead,
	getInstructionRenderState,
	registerIfPropagating,
	shouldRenderInstruction,
} from '../../../../dist/runtime/server/render/head-propagation/runtime.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

function createResult() {
	return {
		partial: false,
		componentMetadata: new Map(),
		_metadata: {
			hasRenderedHead: false,
			headInTree: false,
			propagators: new Set(),
			extraHead: [] as string[],
		},
	};
}

describe('head propagation runtime facade', () => {
	it('registers only propagating components', () => {
		const result = createResult();
		registerIfPropagating(
			result as unknown as SSRResult,
			{ propagation: 'none' } as Parameters<typeof registerIfPropagating>[1],
			{ init: () => null },
		);
		assert.equal(result._metadata.propagators.size, 0);

		registerIfPropagating(
			result as unknown as SSRResult,
			{ propagation: 'self' } as Parameters<typeof registerIfPropagating>[1],
			{ init: () => null },
		);
		assert.equal(result._metadata.propagators.size, 1);
	});

	it('buffers propagated head output into extraHead', async () => {
		const result = createResult();
		result._metadata.propagators.add({
			init() {
				return {
					[headAndContentSym]: true,
					head: '<link rel="stylesheet" href="/one.css">',
				};
			},
		});

		await bufferPropagatedHead(result as unknown as SSRResult);
		assert.deepEqual(result._metadata.extraHead, ['<link rel="stylesheet" href="/one.css">']);
	});

	it('exposes render state and evaluates instruction policy', () => {
		const result = createResult();
		const state = getInstructionRenderState(result as unknown as SSRResult);
		assert.deepEqual(state, {
			hasRenderedHead: false,
			headInTree: false,
			partial: false,
		});
		assert.equal(shouldRenderInstruction('head', state), true);
		assert.equal(shouldRenderInstruction('maybe-head', state), true);
	});
});
