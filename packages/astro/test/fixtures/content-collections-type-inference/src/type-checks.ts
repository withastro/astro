import type { CollectionEntry, InferLoaderSchema } from 'astro:content';

// ============================================================================
// Case 1: Loader with schema on the loader object ("blog" collection)
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

type StandardData = CollectionEntry<'standard'>['data'];

// @ts-expect-error - `headline` is string, not number
const _standardDataCheck: StandardData = { headline: 123 };
const _standardDataOk: StandardData = { headline: 'Hello' };

import { reference, type ReferenceDataEntry } from 'astro:content';
import { reference as referenceField } from 'astro/content/fields';

const _blogRef: ReferenceDataEntry<'blog'> = referenceField('blog', 'my-post');
const _blogRefFromNumber: ReferenceDataEntry<'blog'> = referenceField('blog', 1);
// @ts-expect-error - a reference to `blog` is not a reference to `legacy`
const _wrongCollection: ReferenceDataEntry<'legacy'> = referenceField('blog', 'my-post');

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

const _manualKey: CollectionKey = 'manual';
// @ts-expect-error - `nope` is not a collection
const _unknownKey: CollectionKey = 'nope';
const _manualEntries = await getCollection('manual');
const _manualHeadline: string = _manualEntries[0].data.headline;
// @ts-expect-error - `nope` is not a collection
await getCollection('nope');

type DynamicData = CollectionEntry<'dynamic'>['data'];

// @ts-expect-error - `headline` is string, not number
const _dynamicCheck: DynamicData = { headline: 123 };
const _dynamicOk: DynamicData = { headline: 'Hello' };
// @ts-expect-error - the generated type has no such field
const _dynamicExtra: DynamicData = { headline: 'Hello', nope: true };

type ReferencingData = CollectionEntry<'referencing'>['data'];

// @ts-expect-error - `author` resolves to a reference, not a string
const _referencingCheck: ReferencingData = { author: '1', legacyAuthor: '1' };
const _referencingOk: ReferencingData = {
	author: { collection: 'schemaless', id: '1' },
	legacyAuthor: { collection: 'schemaless', id: '1' },
};
// @ts-expect-error - `title` is string, not number
const _stillInferred: CollectionEntry<'legacy'>['data'] = { title: 123, legacyField: true };

type IsNever<T> = [T] extends [never] ? true : false;
const _unknownReference = referenceField('nope', 'an-id');
const _unknownIsNever: IsNever<typeof _unknownReference> = true;
const _knownReference = referenceField('legacy', 'an-id');
const _knownIsNotNever: IsNever<typeof _knownReference> = false;
