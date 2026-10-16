import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { defineCollection } from 'astro/content/config';
import type { LiveLoader } from 'astro/loaders';
import * as z from 'astro/zod';

interface Data {
	body: string;
}

const loader: LiveLoader<Data, { id: string }, { tag?: string }> = {
	name: 'test-loader',
	loadEntry: async () => undefined,
	loadCollection: async () => ({ entries: [] }),
};

describe("defineCollection({ type: 'live' })", () => {
	it('keeps the type of the live loader', () => {
		const collection = defineCollection({ type: 'live', loader });
		expectTypeOf(collection.loader).toEqualTypeOf<typeof loader>();
		expectTypeOf(collection.type).toEqualTypeOf<'live'>();
	});

	it('keeps the type of the schema', () => {
		const schema = z.object({ body: z.string() });
		const collection = defineCollection({ type: 'live', loader, schema });
		expectTypeOf(collection.schema).toEqualTypeOf<typeof schema | undefined>();
	});

	it('requires `loadCollection()` and `loadEntry()`', () => {
		defineCollection({
			type: 'live',
			// @ts-expect-error: `loadEntry()` is missing
			loader: { name: 'test-loader', loadCollection: loader.loadCollection },
		});
	});

	it('rejects schema functions', () => {
		defineCollection({
			type: 'live',
			loader,
			// @ts-expect-error: live collections only accept schema objects
			schema: () => z.object({}),
		});
	});
});
