import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getComponentAssetOrder } from '../../../dist/core/build/component-assets.js';

describe('component asset order', () => {
	it('places dependencies before importers and preserves sibling import order', () => {
		const dependencies = new Map([
			['page', ['one', 'two']],
			['one', ['shared']],
			['two', ['shared']],
			['shared', []],
		]);
		const order = getComponentAssetOrder(['page'], (id) => dependencies.get(id)!);
		assert.deepEqual([...order.keys()], ['shared', 'one', 'two', 'page']);
	});

	it('visits cyclic imports once', () => {
		const order = getComponentAssetOrder(['one', 'two'], (id) => [id === 'one' ? 'two' : 'one']);
		assert.deepEqual([...order.keys()], ['two', 'one']);
	});
});
