import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defineCollection, defineEntrypointLiveCollection } from '../../../dist/content/config.js';
import { createGetLiveCollection, createGetLiveEntry } from '../../../dist/content/runtime.js';

const loader = {
	name: 'test-loader',
	loadCollection: async () => ({ entries: [{ id: '1', data: { title: 'One' } }] }),
	loadEntry: async ({ filter }: { filter: { id: string } }) => ({
		id: filter.id,
		data: { title: 'One' },
	}),
};

describe("defineCollection({ type: 'live', entrypoint })", () => {
	it('returns the collection', () => {
		const collection = defineCollection({ type: 'live', entrypoint: './src/live/products.ts' });
		assert.deepEqual(collection, { type: 'live', entrypoint: './src/live/products.ts' });
	});

	it('rejects a loader or a schema', () => {
		assert.throws(
			() =>
				defineCollection({
					type: 'live',
					entrypoint: './src/live/products.ts',
					// @ts-expect-error: the loader is defined in the entrypoint
					loader,
				}),
			/cannot have a `loader` or a `schema`/,
		);
	});

	it('rejects an entrypoint that is not a string', () => {
		assert.throws(
			// @ts-expect-error: the entrypoint must be a path
			() => defineCollection({ type: 'live', entrypoint: new URL('file:///live.ts') }),
			/must be a path to a module/,
		);
	});
});

describe('defineEntrypointLiveCollection()', () => {
	it('validates the collection', () => {
		assert.equal(defineEntrypointLiveCollection({ loader }).type, 'live');
		assert.throws(
			() =>
				defineEntrypointLiveCollection({
					// @ts-expect-error: `loadEntry()` is missing
					loader: { name: 'x', loadCollection: loader.loadCollection },
				}),
			/must have `loadCollection\(\)` and `loadEntry\(\)` methods/,
		);
	});
});

describe('live collection entrypoints at runtime', () => {
	function entrypoints(load: () => Promise<{ default?: unknown }>) {
		return { products: { entrypoint: './src/live/products.ts', load } };
	}

	it('loads the collection from its entrypoint', async () => {
		let imports = 0;
		const liveCollectionEntrypoints = entrypoints(async () => {
			imports++;
			return { default: defineEntrypointLiveCollection({ loader }) };
		});
		assert.equal(imports, 0, 'the entrypoint is imported on first use');

		const getLiveCollection = createGetLiveCollection({
			liveCollections: {},
			liveCollectionEntrypoints,
		});
		const getLiveEntry = createGetLiveEntry({ liveCollections: {}, liveCollectionEntrypoints });

		const { entries } = await getLiveCollection('products');
		assert.deepEqual(entries, [{ id: '1', data: { title: 'One' } }]);
		const { entry } = await getLiveEntry('products', '2');
		assert.deepEqual(entry, { id: '2', data: { title: 'One' } });
	});

	it('throws when the entrypoint does not default-export a live collection', async () => {
		const getLiveCollection = createGetLiveCollection({
			liveCollections: {},
			liveCollectionEntrypoints: entrypoints(async () => ({ default: loader })),
		});
		await assert.rejects(
			getLiveCollection('products'),
			/must default-export a collection defined with `defineLiveCollection\(\)`/,
		);
	});

	it('still returns an error for collections that are not live', async () => {
		const getLiveCollection = createGetLiveCollection({
			liveCollections: {},
			liveCollectionEntrypoints: entrypoints(async () => ({})),
		});
		const { error } = await getLiveCollection('blog');
		assert.match(error!.message, /is not a live collection/);
	});
});
