import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	RoutedDataStoreSource,
	type DataStoreSource,
} from '../../../dist/content/data-store-source.js';

function createSource(entries: Record<string, Record<string, any>>): DataStoreSource {
	return {
		hasCollection(collection) {
			return collection in entries;
		},
		get(collection, key) {
			return entries[collection]?.[key];
		},
		values(collection) {
			return Object.values(entries[collection] ?? {});
		},
	};
}

describe('RoutedDataStoreSource', () => {
	it('routes configured collections without loading the embedded source', async () => {
		const source = createSource({ posts: { first: { id: 'first' } } });
		let fallbackLoads = 0;
		const routed = new RoutedDataStoreSource(['posts'], source, async () => {
			fallbackLoads++;
			return createSource({ docs: { intro: { id: 'intro' } } });
		});

		assert.deepEqual(await routed.get('posts', 'first'), { id: 'first' });
		assert.deepEqual(await routed.values('posts'), [{ id: 'first' }]);
		assert.equal(fallbackLoads, 0);
	});

	it('lazily loads and reuses the embedded source for other collections', async () => {
		let fallbackLoads = 0;
		const routed = new RoutedDataStoreSource(['posts'], createSource({ posts: {} }), async () => {
			fallbackLoads++;
			return createSource({ docs: { intro: { id: 'intro' } } });
		});

		assert.equal(await routed.hasCollection('docs'), true);
		assert.deepEqual(await routed.get('docs', 'intro'), { id: 'intro' });
		assert.equal(fallbackLoads, 1);
	});
});
