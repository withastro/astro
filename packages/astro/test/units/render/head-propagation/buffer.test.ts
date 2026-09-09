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

function createResult(pendingSlotEvaluations: Promise<unknown>[] = []): SSRResult {
	return { _metadata: { pendingSlotEvaluations } } as unknown as SSRResult;
}

function tick(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
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

	it('drains async slot pre-renders that register propagators after an await', async () => {
		const propagators = new Set<HeadPropagator>();
		// Mimics an async slot whose markup registers a propagating component
		// (e.g. content `Content` with styles) only after an `await` resolves.
		const slotEvaluation = tick().then(() => {
			propagators.add({
				init: () => createHeadAndContentLike('<style>.from-async-slot{color:red}</style>'),
			});
		});

		const result = createResult([slotEvaluation]);
		const collected = await collectPropagatedHeadParts({ propagators, result, isHeadAndContent });

		assert.deepEqual(collected, ['<style>.from-async-slot{color:red}</style>']);
		// The queue is fully drained.
		assert.equal(result._metadata.pendingSlotEvaluations.length, 0);
	});

	it('drains nested async slot pre-renders queued while collecting', async () => {
		const propagators = new Set<HeadPropagator>();
		const result = createResult();

		// Outer async slot resolves, registers a propagator AND queues a deeper
		// async slot pre-render — the case a one-shot `Promise.all` would miss.
		const outer = tick().then(() => {
			propagators.add({
				init: () => createHeadAndContentLike('<style>.outer{}</style>'),
			});
			const inner = tick().then(() => {
				propagators.add({
					init: () => createHeadAndContentLike('<style>.inner{}</style>'),
				});
			});
			result._metadata.pendingSlotEvaluations.push(inner);
		});
		result._metadata.pendingSlotEvaluations.push(outer);

		const collected = await collectPropagatedHeadParts({ propagators, result, isHeadAndContent });

		assert.deepEqual(collected, ['<style>.outer{}</style>', '<style>.inner{}</style>']);
		assert.equal(result._metadata.pendingSlotEvaluations.length, 0);
	});

	it('drains async slot pre-renders queued by a propagator before advancing', async () => {
		const propagators = new Set<HeadPropagator>();
		const result = createResult();
		propagators.add({
			init() {
				result._metadata.pendingSlotEvaluations.push(
					tick().then(() => {
						propagators.add({
							init: () => createHeadAndContentLike('<style>.from-async-slot{}</style>'),
						});
					}),
				);
				return createHeadAndContentLike('<style>.initial{}</style>');
			},
		});

		const collected = await collectPropagatedHeadParts({ propagators, result, isHeadAndContent });

		assert.deepEqual(collected, ['<style>.initial{}</style>', '<style>.from-async-slot{}</style>']);
		assert.equal(result._metadata.pendingSlotEvaluations.length, 0);
	});

	it('iterates the propagator set linearly, not quadratically', async () => {
		// Pages can render thousands of propagating component instances (e.g.
		// MDX `<Content />` repeated in a loop). A collection strategy that
		// restarts its scan of the set per propagator is O(N²) in iteration
		// steps and dominates render time at that scale.
		let steps = 0;
		class CountingSet<T> extends Set<T> {
			[Symbol.iterator](): SetIterator<T> {
				const iterator = super[Symbol.iterator]();
				const counting = {
					[Symbol.iterator]() {
						return counting;
					},
					next() {
						steps++;
						return iterator.next();
					},
				};
				return counting as SetIterator<T>;
			}
		}

		const count = 100;
		const propagators = new CountingSet<HeadPropagator>();
		for (let i = 0; i < count; i++) {
			propagators.add({ init: () => createHeadAndContentLike(`<style>.s${i}{}</style>`) });
		}

		const collected = await collectPropagatedHeadParts({
			propagators,
			result: createResult(),
			isHeadAndContent,
		});

		assert.equal(collected.length, count);
		// A restart-per-propagator scan takes ~N²/2 steps (~5,000 for N=100).
		assert.ok(
			steps <= count * 3,
			`expected linear iteration over ${count} propagators, took ${steps} steps`,
		);
	});
});
