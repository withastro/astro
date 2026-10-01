import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { defineCollection, defineLiveCollection, type SchemaContext } from 'astro/content/config';
import type { InferCollectionData, InferData, InferLiveData } from 'astro/content/config';
import type { LiveLoader, Loader } from 'astro/loaders';
import { z } from 'astro/zod';

const schema = z.object({ title: z.string() });

const withSchema = defineCollection({
	loader: async () => [{ id: '1' }],
	schema,
});

const withSchemaFactory = defineCollection({
	loader: async () => [{ id: '1' }],
	schema: (context: SchemaContext) => z.object({ filePath: z.literal(context.filePath) }),
});

const withLoaderSchema = defineCollection({
	loader: {
		name: 'loader-with-schema',
		load: async () => {},
		schema: z.object({ headline: z.string() }),
	} satisfies Loader,
});

const schemaless = defineCollection({
	loader: async () => [{ id: '1' }],
});

const legacy = defineCollection({ schema });

// A loader that builds its schema while loading describes nothing statically. `astro sync`
// generates the types it hands back and writes them into `DataMap` itself, so inference is
// expected to fall through to `any` here rather than to guess.
const dynamic = defineCollection({
	loader: {
		name: 'loader-with-created-schema',
		load: async () => {},
		createSchema: async () => ({ schema, types: 'export interface Entry {}' }),
	} satisfies Loader,
});

type ContentConfig = {
	collections: {
		withSchema: typeof withSchema;
		withSchemaFactory: typeof withSchemaFactory;
		withLoaderSchema: typeof withLoaderSchema;
		schemaless: typeof schemaless;
		legacy: typeof legacy;
		dynamic: typeof dynamic;
	};
};

describe('InferData()', () => {
	it('infers a collection from its own schema', () => {
		expectTypeOf<InferData<ContentConfig>['withSchema']>().toEqualTypeOf<{ title: string }>();
		expectTypeOf<InferData<ContentConfig>['legacy']>().toEqualTypeOf<{ title: string }>();
	});

	it('infers a collection from a schema factory', () => {
		expectTypeOf<InferData<ContentConfig>['withSchemaFactory']>().toEqualTypeOf<{
			filePath: string;
		}>();
	});

	it("infers a collection from its loader's schema", () => {
		expectTypeOf<InferData<ContentConfig>['withLoaderSchema']>().toEqualTypeOf<{
			headline: string;
		}>();
	});

	it('falls back to `any` for a collection with no schema at all', () => {
		expectTypeOf<InferData<ContentConfig>['schemaless']>().toBeAny();
	});

	it('falls back to `any` for a loader that builds its schema while loading', () => {
		expectTypeOf<InferData<ContentConfig>['dynamic']>().toBeAny();
	});

	it('is empty for a config that exports no collections', () => {
		expectTypeOf<keyof InferData<{ somethingElse: true }>>().toBeNever();
	});
});

interface Product {
	name: string;
	price: number;
}
class ProductError extends Error {}

const products = defineLiveCollection({
	loader: {} as LiveLoader<Product, { sku: string }, { tag: string }, ProductError>,
});

const overridden = defineLiveCollection({
	loader: {} as LiveLoader<Product>,
	schema: z.object({ name: z.string() }),
});

type LiveConfig = { collections: { products: typeof products; overridden: typeof overridden } };

describe('InferCollectionData()', () => {
	it('infers one collection at a time, the way `astro sync` writes it', () => {
		expectTypeOf<InferCollectionData<ContentConfig, 'withSchema'>>().toEqualTypeOf<{
			title: string;
		}>();
		expectTypeOf<InferCollectionData<ContentConfig, 'withLoaderSchema'>>().toEqualTypeOf<{
			headline: string;
		}>();
		expectTypeOf<InferCollectionData<ContentConfig, 'schemaless'>>().toBeAny();
		expectTypeOf<InferCollectionData<ContentConfig, 'dynamic'>>().toBeAny();
	});

	it('falls back to `any` for a collection the config does not declare', () => {
		expectTypeOf<InferCollectionData<ContentConfig, 'nope'>>().toBeAny();
		expectTypeOf<InferCollectionData<never, 'withSchema'>>().toBeAny();
	});
});

describe('InferLiveData()', () => {
	it('infers data, filters and errors from the live loader', () => {
		expectTypeOf<InferLiveData<LiveConfig>['products']['data']>().toEqualTypeOf<Product>();
		expectTypeOf<InferLiveData<LiveConfig>['products']['entryFilter']>().toEqualTypeOf<{
			sku: string;
		}>();
		expectTypeOf<InferLiveData<LiveConfig>['products']['collectionFilter']>().toEqualTypeOf<{
			tag: string;
		}>();
		expectTypeOf<InferLiveData<LiveConfig>['products']['error']>().toEqualTypeOf<ProductError>();
	});

	it('prefers the collection schema over the data the loader returns', () => {
		expectTypeOf<InferLiveData<LiveConfig>['overridden']['data']>().toEqualTypeOf<{
			name: string;
		}>();
	});
});
