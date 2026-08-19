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
