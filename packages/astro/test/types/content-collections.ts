import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import * as z from 'zod/v4';
import {
	defineCollection,
	type CollectionConfig,
	type TransformContext,
} from '../../dist/content/config.js';
import { createReference } from '../../dist/content/runtime.js';

// Helpers that mirror the template logic in templates/content/types.d.ts
type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
type InferStandardSchema<S> = S extends {
	'~standard': { types?: { output: infer O } | undefined };
}
	? O
	: unknown;
type InferCollectionData<C extends CollectionConfig<any, any>> =
	Required<C> extends { transform: infer T }
		? Awaited<ReturnTypeOrOriginal<T>>
		: InferStandardSchema<ReturnTypeOrOriginal<Required<C>['schema']>>;

describe('defineCollection()', () => {
	describe('schema only (no transform)', () => {
		it('infers entry data type from the Zod schema output', () => {
			const col = defineCollection({
				schema: z.object({ title: z.string(), count: z.number() }),
			});
			type Data = InferCollectionData<typeof col>;
			expectTypeOf<Data>().toEqualTypeOf<{ title: string; count: number }>();
		});

		it('infers entry data type from a function-based Zod schema', () => {
			const col = defineCollection({
				schema: () => z.object({ title: z.string() }),
			});
			type Data = InferCollectionData<typeof col>;
			expectTypeOf<Data>().toEqualTypeOf<{ title: string }>();
		});
	});

	describe('with transform', () => {
		it('infers entry data type from the transform return type, not unknown', () => {
			const col = defineCollection({
				schema: z.object({ title: z.string() }),
				transform: (data) => ({ ...data, upper: data.title.toUpperCase() }),
			});
			type Data = InferCollectionData<typeof col>;
			expectTypeOf<Data>().toEqualTypeOf<{ title: string; upper: string }>();
		});

		it('infers entry data type from an async transform return type', () => {
			const col = defineCollection({
				schema: z.object({ title: z.string() }),
				transform: async (data) => ({ ...data, upper: data.title.toUpperCase() }),
			});
			type Data = InferCollectionData<typeof col>;
			expectTypeOf<Data>().toEqualTypeOf<{ title: string; upper: string }>();
		});

		it('does not give unknown when transform is present', () => {
			const col = defineCollection({
				schema: z.object({ title: z.string() }),
				transform: (data) => ({ ...data, extra: 42 }),
			});
			type Data = InferCollectionData<typeof col>;
			expectTypeOf<Data>().not.toBeUnknown();
		});

		it('transform receives the schema output type as its first argument', () => {
			defineCollection({
				schema: z.object({ title: z.string(), count: z.number() }),
				transform: (data) => {
					expectTypeOf(data).toEqualTypeOf<{ title: string; count: number }>();
					return data;
				},
			});
		});

		it('transform receives TransformContext as its second argument', () => {
			defineCollection({
				schema: z.object({ title: z.string() }),
				transform: (_data, ctx) => {
					expectTypeOf(ctx).toEqualTypeOf<TransformContext>();
					return _data;
				},
			});
		});
	});
});

describe('reference()', () => {
	const reference = createReference();

	it('1-arg form returns a Standard Schema', () => {
		const schema = reference('authors');
		expectTypeOf(schema).toHaveProperty('~standard');
	});

	it('2-arg form returns { id, collection }', () => {
		const ref = reference('authors', 'ben-holmes');
		expectTypeOf(ref).toEqualTypeOf<{ id: string; collection: 'authors' }>();
	});

	it('2-arg form preserves the collection name as a literal type', () => {
		const ref = reference('posts', 'my-post');
		expectTypeOf(ref.collection).toEqualTypeOf<'posts'>();
	});
});
