import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBasicPipeline } from '../test-utils.ts';

describe('actions HMR cache invalidation', () => {
	it('clearActions() resets the cached resolved actions', async () => {
		const firstActions = { server: { greet: () => 'hello' } } as any;
		const secondActions = { server: { greet: () => 'updated' } } as any;

		let callCount = 0;
		const pipeline = createBasicPipeline({
			manifest: {
				actions: () => {
					callCount++;
					return callCount === 1 ? firstActions : secondActions;
				},
			},
		} as any);

		// First call should invoke the factory and cache the result.
		const result1 = await pipeline.getActions();
		assert.equal(callCount, 1);
		assert.equal(result1, firstActions);

		// Subsequent call should return the cached value, not call the factory again.
		const result2 = await pipeline.getActions();
		assert.equal(callCount, 1, 'factory should not be called again while cached');
		assert.equal(result2, firstActions);

		// After clearing, the next call should invoke the factory again.
		pipeline.clearActions();
		const result3 = await pipeline.getActions();
		assert.equal(callCount, 2, 'factory should be called again after clearActions()');
		assert.equal(result3, secondActions);
	});

	it('getActions() returns NOOP when no actions factory is configured', async () => {
		const pipeline = createBasicPipeline();
		const result = await pipeline.getActions();
		assert.ok(result, 'should return a non-undefined value');
		assert.deepEqual(result.server, {}, 'should return noop actions with empty server');
	});
});
