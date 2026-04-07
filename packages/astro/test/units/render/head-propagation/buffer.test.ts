import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HeadPropagator } from '../../../../dist/core/head-propagation/buffer.js';
import { collectPropagatedHeadParts } from '../../../../dist/core/head-propagation/buffer.js';
import type { SSRResult } from '../../../../dist/types/public/internal.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

function createHeadAndContentLike(head: string) {
	return {
		[headAndContentSym]: true,
		head,
	};
}

function isHeadAndContent(value: unknown): value is { head: string } {
	return typeof value === 'object' && value !== null && headAndContentSym in value;
}

function createResult(): SSRResult {
	return {} as SSRResult;
}

describe('head propagation buffer', () => {
	it('returns empty head parts when no propagators exist', async () => {
		const collected = await collectPropagatedHeadParts({
			propagators: new Set<HeadPropagator>(),
			result: createResult(),
			isHeadAndContent,
		});
		assert.deepEqual(collected, []);
	});

	it('collects non-empty head strings from propagators', async () => {
		const propagators = new Set<HeadPropagator>([
			{ init: () => createHeadAndContentLike('<link rel="stylesheet" href="/a.css">') },
			{ init: () => createHeadAndContentLike('<style>body{color:red}</style>') },
		]);

		const collected = await collectPropagatedHeadParts({
			propagators,
			result: createResult(),
			isHeadAndContent,
		});

		assert.deepEqual(collected, [
			'<link rel="stylesheet" href="/a.css">',
			'<style>body{color:red}</style>',
		]);
	});

	it('skips non-head-and-content values and empty heads', async () => {
		const propagators = new Set<HeadPropagator>([
			{ init: () => 'value' },
			{ init: () => createHeadAndContentLike('') },
			{ init: () => createHeadAndContentLike('<meta charset="utf-8">') },
		]);

		const collected = await collectPropagatedHeadParts({
			propagators,
			result: createResult(),
			isHeadAndContent,
		});

		assert.deepEqual(collected, ['<meta charset="utf-8">']);
	});

	it('processes propagators added while iterating', async () => {
		const propagators = new Set<HeadPropagator>();
		propagators.add({
			init() {
				propagators.add({
					init() {
						return createHeadAndContentLike('<link rel="stylesheet" href="/late.css">');
					},
				});
				return createHeadAndContentLike('<link rel="stylesheet" href="/early.css">');
			},
		});

		const collected = await collectPropagatedHeadParts({
			propagators,
			result: createResult(),
			isHeadAndContent,
		});

		assert.deepEqual(collected, [
			'<link rel="stylesheet" href="/early.css">',
			'<link rel="stylesheet" href="/late.css">',
		]);
	});
});
