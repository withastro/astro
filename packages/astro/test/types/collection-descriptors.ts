import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { defineCollection, defineLiveCollection } from 'astro/content/config';
import type { LiveLoader, Loader } from 'astro/loaders';

const load = async () => {};

describe('collection descriptors', () => {
	it('checks the descriptors of a loader against its type', () => {
		const loader: Loader<{ starlight: 'docs' }> = {
			name: 'docs',
			load,
			descriptors: { starlight: 'docs' },
		};
		expectTypeOf(loader.descriptors).toEqualTypeOf<{ starlight: 'docs' } | undefined>();

		const wrong: Loader<{ starlight: 'docs' }> = {
			name: 'docs',
			load,
			// @ts-expect-error the value doesn't match the loader's descriptors type
			descriptors: { starlight: 'dosc' },
		};
		expectTypeOf(wrong).not.toBeNever();
	});

	it('checks the descriptors of a live loader against its type', () => {
		const loader: LiveLoader<{ title: string }, never, never, Error, { shop: true }> = {
			name: 'products',
			descriptors: { shop: true },
			loadEntry: async () => undefined,
			loadCollection: async () => ({ entries: [] }),
		};
		expectTypeOf(loader.descriptors).toEqualTypeOf<{ shop: true } | undefined>();
	});

	it('keeps the literal types of the descriptors passed to defineCollection()', () => {
		const config = defineCollection({
			loader: { name: 'docs', load },
			descriptors: { version: 2, audience: ['beginners'] },
		});
		// `defineCollection()` returns every kind of collection config, only one has a loader
		type ContentLayerConfig = Extract<typeof config, { loader: unknown }>;
		expectTypeOf<ContentLayerConfig['descriptors']>().toEqualTypeOf<
			{ readonly version: 2; readonly audience: ['beginners'] } | undefined
		>();
	});

	it('keeps the literal types of the descriptors passed to defineLiveCollection()', () => {
		const config = defineLiveCollection({
			loader: {
				name: 'products',
				loadEntry: async () => undefined,
				loadCollection: async () => ({ entries: [] }),
			},
			descriptors: { featured: true },
		});
		expectTypeOf(config.descriptors).toEqualTypeOf<{ readonly featured: true } | undefined>();
	});

	it('rejects descriptors that are not JSON values', () => {
		// @ts-expect-error functions are not JSON values
		defineCollection({ loader: { name: 'docs', load }, descriptors: { check: () => true } });
	});
});
