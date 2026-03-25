import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectPropagatedHeadParts } from '../../../../dist/core/head-propagation/buffer.js';

const headAndContentSym = Symbol.for('astro.headAndContent');

function createHeadAndContentLike(head) {
	return {
		[headAndContentSym]: true,
		head,
	};
}

function isHeadAndContent(value) {
	return typeof value === 'object' && value !== null && headAndContentSym in value;
}

function createResult() {
	return {};
}

describe('head propagation buffer', () => {
	it('returns empty head parts when no propagators exist', async () => {
		const collected = await collectPropagatedHeadParts({
			propagators: new Set(),
			result: createResult(),
			isHeadAndContent,
		});
		assert.deepEqual(collected, []);
	});

	it('collects non-empty head strings from propagators', async () => {
		const propagators = new Set([
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
		const propagators = new Set([
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
		const propagators = new Set();
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
