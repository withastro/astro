import { describe, it } from 'node:test';
import type { AstroAdapter } from 'astro';
import { defineCollection, type SchemaContext } from 'astro/content/config';
import type { DataStoreSource, DataStoreSourceFactory } from 'astro/content/source';
import { z } from 'astro/zod';
import { expectTypeOf } from 'expect-type';

describe('adapter-backed content collections', () => {
	it('accepts a source and schema in regular collection config', () => {
		const schema = z.object({ title: z.string() });
		const collection = defineCollection({ source: 'adapter', schema });

		if ('source' in collection) {
			expectTypeOf(collection.source).toEqualTypeOf<'adapter'>();
			expectTypeOf(collection.schema).toEqualTypeOf<
				typeof schema | ((context: SchemaContext) => typeof schema) | undefined
			>();
		}
	});

	it('exposes the adapter and source contracts', () => {
		expectTypeOf<NonNullable<AstroAdapter['contentCollectionSource']>>().toEqualTypeOf<{
			entrypoint: string | URL;
			config?: Record<string, unknown>;
		}>();

		const source: DataStoreSource = {
			hasCollection: () => true,
			get: () => undefined,
			values: () => [],
		};
		const factory: DataStoreSourceFactory<{ binding: string }> = async () => source;

		expectTypeOf(factory).returns.resolves.toEqualTypeOf<DataStoreSource>();
	});
});
