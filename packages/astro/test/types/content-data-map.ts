import { describe, it } from 'node:test';
import '../../client.d.ts';
import { expectTypeOf } from 'expect-type';
import {
	getCollection,
	getEntries,
	getEntry,
	getLiveCollection,
	getLiveEntry,
	render,
	type CollectionEntry,
	type CollectionKey,
	type DataEntryMap,
	type InferLoaderSchema,
	type ReferenceDataEntry,
	type RenderResult,
} from 'astro:content';
import { reference } from 'astro/content/fields';

declare module 'astro:content' {
	interface DataMap {
		blog: { title: string };
		authors: { name: string };
	}
	interface LiveDataMap {
		products: {
			data: { name: string; price: number };
			entryFilter: { sku: string };
			collectionFilter: { tag: string };
			error: TypeError;
		};
		minimal: { data: { id: number } };
	}
}

describe('DataMap', () => {
	it('names every collection', () => {
		expectTypeOf<CollectionKey>().toEqualTypeOf<'blog' | 'authors'>();
	});

	it('types the data of an entry', () => {
		expectTypeOf<CollectionEntry<'blog'>['data']>().toEqualTypeOf<{ title: string }>();
		expectTypeOf<CollectionEntry<'blog'>['id']>().toEqualTypeOf<string>();
		expectTypeOf<CollectionEntry<'blog'>['collection']>().toEqualTypeOf<'blog'>();
	});

	it('distributes over a union of collections', () => {
		expectTypeOf<CollectionEntry<'blog' | 'authors'>>().toEqualTypeOf<
			CollectionEntry<'blog'> | CollectionEntry<'authors'>
		>();
	});

	it('types the collection APIs', async () => {
		expectTypeOf(await getCollection('blog')).toEqualTypeOf<Array<CollectionEntry<'blog'>>>();
		expectTypeOf(await getEntry('blog', 'a-post')).toEqualTypeOf<
			CollectionEntry<'blog'> | undefined
		>();
		const ref = reference('authors', 'ada');
		expectTypeOf(ref).toEqualTypeOf<ReferenceDataEntry<'authors'>>();
		expectTypeOf(await getEntry(ref)).toEqualTypeOf<CollectionEntry<'authors'>>();
		expectTypeOf(await getEntries([ref])).toEqualTypeOf<Array<CollectionEntry<'authors'>>>();
		expectTypeOf(await render({} as CollectionEntry<'blog'>)).toEqualTypeOf<RenderResult>();
	});

	it('checks the collection a reference points at', () => {
		expectTypeOf(reference('authors', 'ada')).toEqualTypeOf<ReferenceDataEntry<'authors'>>();
		expectTypeOf(reference('nope', 'ada')).toBeNever();
	});

	it('accepts explicit entry IDs and loader types', async () => {
		const entry: ReferenceDataEntry<'authors', 'ada'> = { collection: 'authors', id: 'ada' };
		expectTypeOf(entry.id).toEqualTypeOf<'ada'>();
		expectTypeOf(await getEntry<'authors', 'ada'>(entry)).toEqualTypeOf<
			CollectionEntry<'authors'>
		>();
		expectTypeOf(await getEntry<'authors', 'ada'>('authors', 'ada')).toEqualTypeOf<
			CollectionEntry<'authors'> | undefined
		>();
		type Loader = { schema: import('astro/zod').ZodNumber };
		expectTypeOf<InferLoaderSchema<'authors', Loader>>().toEqualTypeOf<number>();
	});

	// TODO: remove in Astro 8
	it('still resolves the deprecated `DataEntryMap`', () => {
		expectTypeOf<DataEntryMap['blog'][string]>().toEqualTypeOf<CollectionEntry<'blog'>>();
	});
});

describe('LiveDataMap', () => {
	it('types a live collection from its loader', async () => {
		const { entries, error } = await getLiveCollection('products', { tag: 'sale' });
		expectTypeOf(entries?.[0].data).toEqualTypeOf<{ name: string; price: number } | undefined>();
		expectTypeOf<TypeError | undefined>().toExtend<typeof error>();

		const { entry } = await getLiveEntry('products', { sku: 'abc' });
		expectTypeOf(entry?.data).toEqualTypeOf<{ name: string; price: number } | undefined>();
	});

	it('only needs `data` to be declared by hand', async () => {
		const { entry, error } = await getLiveEntry('minimal', 'an-id');
		expectTypeOf(entry?.data).toEqualTypeOf<{ id: number } | undefined>();
		expectTypeOf<Error | undefined>().toExtend<typeof error>();
	});
});
