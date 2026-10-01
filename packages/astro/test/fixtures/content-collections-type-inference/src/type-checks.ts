/**
 * Type assertions for content collection type inference.
 *
 * This file is NOT executed at runtime. It is type-checked by tsc after
 * `astro sync` generates the .astro/content.d.ts types for this fixture.
 *
 * Each @ts-expect-error comment asserts that the line below it IS a type error,
 * meaning the type is NOT `any` or `never` where it shouldn't be.
 *
 * If the types in astro/types/content.d.ts or the inference in astro/content/config
 * regress, tsc will fail here because a @ts-expect-error will become unused (the type
 * collapsed to `any`).
 */
import type { CollectionEntry, InferLoaderSchema } from 'astro:content';

// ============================================================================
// Case 1: Loader with schema on the loader object ("blog" collection)
// The loader's own schema types the collection's data.
// ============================================================================

type BlogEntry = CollectionEntry<'blog'>;
type BlogData = BlogEntry['data'];

// BlogData should be { test: string }, NOT any.
// If it were `any`, assigning a number to a string field would not error.
// @ts-expect-error - `test` is string, not number
const _blogDataCheck: BlogData = { test: 123 };

type InferredBlogSchema = InferLoaderSchema<'blog'>;
// @ts-expect-error - `test` is string, not number
const _inferredBlogCheck: InferredBlogSchema = { test: 123 };

// ============================================================================
// Case 2: Legacy collection with schema on the collection ("legacy")
// A schema on the collection takes precedence over anything its loader declares.
// ============================================================================

type LegacyData = CollectionEntry<'legacy'>['data'];

// LegacyData should be { title: string; legacyField: boolean }.
// @ts-expect-error - `title` is string, not number
const _legacyTitleCheck: LegacyData = { title: 123, legacyField: true };
// @ts-expect-error - `legacyField` is boolean, not string
const _legacyFieldCheck: LegacyData = { title: 'ok', legacyField: 'not a boolean' };

// ============================================================================
// Case 3: Loader with no schema ("schemaless" collection)
// Should fall back to `any` — this is the correct behavior.
// ============================================================================

type SchemalessData = InferLoaderSchema<'schemaless'>;

// If the type is correctly `any`, then any assignment is valid and
// a ts-expect-error on a valid assignment would be an error itself.
// So we verify `any` by checking that arbitrary property access works:
const _schemalessValue: SchemalessData = { anything: 'goes', count: 42 };
const _schemalessAccess: string = _schemalessValue.nonExistentProp;

// ============================================================================
// Case 4: Collection validated by a Standard Schema validator that is not Zod
// ("standard"). Its output type comes from `~standard.types`, so inference has to
// work for any validator, not just Zod.
// ============================================================================

type StandardData = CollectionEntry<'standard'>['data'];

// @ts-expect-error - `headline` is string, not number
const _standardDataCheck: StandardData = { headline: 123 };
const _standardDataOk: StandardData = { headline: 'Hello' };

// ============================================================================
// `reference()`: two overloads, chosen by whether a lookup is passed.
// ============================================================================

import { reference, type ReferenceDataEntry } from 'astro:content';

// With a lookup, it resolves to the reference itself — the shape `getEntry()` takes.
const _blogRef: ReferenceDataEntry<'blog'> = reference('blog', 'my-post');
// A numeric id is accepted too, and still narrows to the right collection.
const _blogRefFromNumber: ReferenceDataEntry<'blog'> = reference('blog', 1);
// @ts-expect-error - a reference to `blog` is not a reference to `legacy`
const _wrongCollection: ReferenceDataEntry<'legacy'> = reference('blog', 'my-post');

// Without one, it returns a schema, and the schema's output is the reference.
const _blogRefSchema = reference('blog');
// @ts-expect-error - the schema is not itself a reference
const _schemaIsNotRef: ReferenceDataEntry<'blog'> = _blogRefSchema;
const _blogRefSchemaOutput: import('astro/zod').output<typeof _blogRefSchema> = {
	collection: 'blog',
	id: 'my-post',
};
const _wrongSchemaOutput: import('astro/zod').output<typeof _blogRefSchema> = {
	// @ts-expect-error - the schema resolves to `blog`, not `legacy`
	collection: 'legacy',
	id: 'my-post',
};

// ============================================================================
// `DataMap` is an interface, so a collection Astro cannot infer — one an integration
// ships, or one typed by hand — can be declared directly.
// ============================================================================

import { getCollection, type CollectionKey } from 'astro:content';

declare module 'astro:content' {
	interface DataMap {
		manual: { headline: string };
	}
}

type ManualData = CollectionEntry<'manual'>['data'];
// @ts-expect-error - `headline` is string, not number
const _manualCheck: ManualData = { headline: 123 };
const _manualOk: ManualData = { headline: 'Hello' };

// A hand-declared collection is a collection like any other.
const _manualKey: CollectionKey = 'manual';
// @ts-expect-error - `nope` is not a collection
const _unknownKey: CollectionKey = 'nope';
const _manualEntries = await getCollection('manual');
const _manualHeadline: string = _manualEntries[0].data.headline;
// @ts-expect-error - `nope` is not a collection
await getCollection('nope');

// ============================================================================
// Case 5: Loader with `createSchema()` ("dynamic" collection)
// Nothing in the config describes this collection, so its type is the one `astro sync`
// generated into `.astro/loaders/dynamic.ts`. If the generated member were dropped, the
// collection would fall back to `any` and the assertion below would stop erroring.
// ============================================================================

type DynamicData = CollectionEntry<'dynamic'>['data'];

// @ts-expect-error - `headline` is string, not number
const _dynamicCheck: DynamicData = { headline: 123 };
const _dynamicOk: DynamicData = { headline: 'Hello' };
// @ts-expect-error - the generated type has no such field
const _dynamicExtra: DynamicData = { headline: 'Hello', nope: true };

// ============================================================================
// Case 6: `reference()` inside a schema. Its type must not depend on the collections
// the config declares, or resolving the config would depend on itself and every
// collection in it — not just this one — would silently become `any`.
// ============================================================================

type ReferencingData = CollectionEntry<'referencing'>['data'];

// @ts-expect-error - `author` resolves to a reference, not a string
const _referencingCheck: ReferencingData = { author: '1', legacyAuthor: '1' };
const _referencingOk: ReferencingData = {
	author: { collection: 'schemaless', id: '1' },
	legacyAuthor: { collection: 'schemaless', id: '1' },
};
// The other collections keep their types too.
// @ts-expect-error - `title` is string, not number
const _stillInferred: CollectionEntry<'legacy'>['data'] = { title: 123, legacyField: true };

// A name that is not a collection resolves to `never`, so the reference cannot be used. This
// is the check that a `DataMap` inferred as a whole would lose: resolving `keyof DataMap` from
// inside the config it is inferred from makes the config depend on itself, and every collection
// in it collapses to `any`.
type IsNever<T> = [T] extends [never] ? true : false;
const _unknownReference = reference('nope', 'an-id');
const _unknownIsNever: IsNever<typeof _unknownReference> = true;
const _knownReference = reference('legacy', 'an-id');
const _knownIsNotNever: IsNever<typeof _knownReference> = false;
