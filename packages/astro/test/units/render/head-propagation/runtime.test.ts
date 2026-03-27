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

type MockResult = {
	partial: boolean;
	componentMetadata: Map<string, unknown>;
	_metadata: {
		hasRenderedHead: boolean;
		headInTree: boolean;
		propagators: Set<{ init: () => unknown }>;
		extraHead: string[];
	};
};

function createResult(): SSRResult {
	return {
		partial: false,
		componentMetadata: new Map<string, unknown>(),
		_metadata: {
			hasRenderedHead: false,
			headInTree: false,
			propagators: new Set<{ init: () => unknown }>(),
			extraHead: [] as string[],
		},
	} as unknown as SSRResult;
}

describe('head propagation runtime facade', () => {
	it('registers only propagating components', () => {
		const result = createResult();
		registerIfPropagating(result, { propagation: 'none' } as any, { init: () => null });
		assert.equal((result as unknown as MockResult)._metadata.propagators.size, 0);

		registerIfPropagating(result, { propagation: 'self' } as any, { init: () => null });
		assert.equal((result as unknown as MockResult)._metadata.propagators.size, 1);
	});

	it('buffers propagated head output into extraHead', async () => {
		const result = createResult();
		(result as unknown as MockResult)._metadata.propagators.add({
			init() {
				return {
					[headAndContentSym]: true,
					head: '<link rel="stylesheet" href="/one.css">',
				};
			},
		});

		await bufferPropagatedHead(result);
		assert.deepEqual((result as unknown as MockResult)._metadata.extraHead, [
			'<link rel="stylesheet" href="/one.css">',
		]);
	});

	it('exposes render state and evaluates instruction policy', () => {
		const result = createResult();
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
