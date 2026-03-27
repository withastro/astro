import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroComponentInstance } from '../../../../dist/runtime/server/render/astro/instance.js';
import { collectPropagatedHeadParts } from '../../../../dist/core/head-propagation/buffer.js';
import { createMockResult } from '../../mocks.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

function createHeadAndContentLike(head: string) {
	return {
		[headAndContentSym]: true,
		head,
	};
}

function isHeadAndContent(value: unknown): value is { head: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		headAndContentSym in value &&
		typeof (value as Record<symbol, unknown>)[headAndContentSym] === 'boolean'
	);
}

/** Creates a stub propagator that returns the given value from init(). */
function stubPropagator(initResult: unknown): AstroComponentInstance {
	return { init: () => initResult } as unknown as AstroComponentInstance;
}

describe('head propagation buffer', () => {
	it('returns empty head parts when no propagators exist', async () => {
		const collected = await collectPropagatedHeadParts({
			propagators: new Set(),
			result: createMockResult(),
			isHeadAndContent,
		});
		assert.deepEqual(collected, []);
	});

	it('collects non-empty head strings from propagators', async () => {
		const propagators = new Set([
			stubPropagator(createHeadAndContentLike('<link rel="stylesheet" href="/a.css">')),
			stubPropagator(createHeadAndContentLike('<style>body{color:red}</style>')),
		]);

		const collected = await collectPropagatedHeadParts({
			propagators,
			result: createMockResult(),
			isHeadAndContent,
		});

		assert.deepEqual(collected, [
			'<link rel="stylesheet" href="/a.css">',
			'<style>body{color:red}</style>',
		]);
	});

	it('skips non-head-and-content values and empty heads', async () => {
		const propagators = new Set([
			stubPropagator('value'),
			stubPropagator(createHeadAndContentLike('')),
			stubPropagator(createHeadAndContentLike('<meta charset="utf-8">')),
		]);

		const collected = await collectPropagatedHeadParts({
			propagators,
			result: createMockResult(),
			isHeadAndContent,
		});

		assert.deepEqual(collected, ['<meta charset="utf-8">']);
	});

	it('processes propagators added while iterating', async () => {
		const propagators = new Set<AstroComponentInstance>();
		// This propagator adds a second one to the set when init() is called,
		// testing that newly-added propagators during iteration are also processed.
		const earlyPropagator: AstroComponentInstance = {
			init() {
				propagators.add(
					stubPropagator(createHeadAndContentLike('<link rel="stylesheet" href="/late.css">')),
				);
				return createHeadAndContentLike('<link rel="stylesheet" href="/early.css">');
			},
		} as unknown as AstroComponentInstance;
		propagators.add(earlyPropagator);

		const collected = await collectPropagatedHeadParts({
			propagators,
			result: createMockResult(),
			isHeadAndContent,
		});

		assert.deepEqual(collected, [
			'<link rel="stylesheet" href="/early.css">',
			'<link rel="stylesheet" href="/late.css">',
		]);
	});
});
