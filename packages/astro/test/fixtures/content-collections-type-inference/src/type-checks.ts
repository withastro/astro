/**
 * Type assertions for content collection type inference.
 *
 * This file is NOT executed at runtime. It is type-checked by tsc after
 * `astro sync` generates the .astro/content.d.ts types for this fixture.
 *
 * Each @ts-expect-error comment asserts that the line below it IS a type error,
 * meaning the type is NOT `any` or `never` where it shouldn't be.
 *
 * If the patch in templates/content/types.d.ts regresses, tsc will fail here
 * because a @ts-expect-error will become unused (the type collapsed to `any`).
 */
import type { CollectionEntry, InferLoaderSchema } from 'astro:content';

// ============================================================================
// Case 1: Loader with schema on the loader object ("blog" collection)
// The patched ExtractLoaderConfig should correctly extract the loader's schema.
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
// Should NOT be broken by the ExtractLoaderConfig patch.
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
