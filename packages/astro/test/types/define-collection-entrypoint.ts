import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { defineCollection, type LiveEntrypointCollectionConfig } from 'astro/content/config';
import type { LiveLoader } from 'astro/loaders';

const loader: LiveLoader<{ title: string }> = {
	name: 'test-loader',
	loadEntry: async () => undefined,
	loadCollection: async () => ({ entries: [] }),
};

describe("defineCollection({ type: 'live', entrypoint })", () => {
	it('returns a live collection with an entrypoint', () => {
		const collection = defineCollection({ type: 'live', entrypoint: './src/live/products.ts' });
		expectTypeOf(collection).toEqualTypeOf<LiveEntrypointCollectionConfig>();
	});

	it('rejects a loader', () => {
		// @ts-expect-error: the loader is defined in the entrypoint
		defineCollection({ type: 'live', entrypoint: './src/live/products.ts', loader });
	});

	it('requires an entrypoint', () => {
		// @ts-expect-error: `entrypoint` is missing
		defineCollection({ type: 'live' });
	});
});
