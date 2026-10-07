import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import { resolveParallelPrerenderWorkers } from '../../../dist/core/build/parallel-prerenderer.js';

describe('resolveParallelPrerenderWorkers', () => {
	const defaultWorkers = Math.max(1, os.availableParallelism() - 1);

	it('defaults to available parallelism minus the main thread', () => {
		assert.equal(resolveParallelPrerenderWorkers(true), defaultWorkers);
		assert.equal(resolveParallelPrerenderWorkers({}), defaultWorkers);
	});

	it('uses the configured worker count', () => {
		assert.equal(resolveParallelPrerenderWorkers({ workers: 3 }), 3);
	});
});
