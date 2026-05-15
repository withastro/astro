import type { MarkdownHeading } from '@astrojs/markdown-remark';
import * as z from 'zod/v4';
import type * as zCore from 'zod/v4/core';
import type { ImageMetadata } from '../assets/types.js';
import { type AstroComponentFactory } from '../runtime/server/index.js';
import type { LiveDataCollectionResult, LiveDataEntryResult } from '../types/public/content.js';
import { type LIVE_CONTENT_TYPE } from './consts.js';
import { type DataEntry } from './data-store.js';
import {
	LiveCollectionCacheHintError,
	LiveCollectionError,
	LiveCollectionValidationError,
	LiveEntryNotFoundError,
} from './loaders/errors.js';
import type { LiveLoader } from './loaders/types.js';
export {
	LiveCollectionError,
	LiveCollectionCacheHintError,
	LiveEntryNotFoundError,
	LiveCollectionValidationError,
};
type LiveCollectionConfigMap = Record<
	string,
	{
		loader: LiveLoader;
		type: typeof LIVE_CONTENT_TYPE;
		schema?: zCore.$ZodType;
	}
>;
export declare function createGetCollection({
	liveCollections,
}: {
	liveCollections: LiveCollectionConfigMap;
}): (
	collection: string,
	filter?: ((entry: any) => unknown) | Record<string, unknown>,
) => Promise<
	{
		data: Record<string, unknown>;
		collection: string;
		id: string;
		filePath?: string;
		body?: string;
		digest?: number | string;
		rendered?: import('./data-store.js').RenderedContent;
		deferredRender?: boolean;
		assetImports?: Array<string>;
	}[]
>;
type ContentEntryResult = {
	id: string;
	slug: string;
	body: string;
	collection: string;
	data: Record<string, any>;
	render(): Promise<RenderResult>;
};
type DataEntryResult = {
	id: string;
	collection: string;
	data: Record<string, any>;
};
type EntryLookupObject =
	| {
			collection: string;
			id: string;
	  }
	| {
			collection: string;
			slug: string;
	  };
export declare function createGetEntry({
	liveCollections,
}: {
	liveCollections: LiveCollectionConfigMap;
}): (
	collectionOrLookupObject: string | EntryLookupObject,
	lookup?: string | Record<string, unknown>,
) => Promise<ContentEntryResult | DataEntryResult | undefined>;
export declare function createGetEntries(getEntry: ReturnType<typeof createGetEntry>): (
	entries:
		| {
				collection: string;
				id: string;
		  }[]
		| {
				collection: string;
				slug: string;
		  }[],
) => Promise<(ContentEntryResult | DataEntryResult | undefined)[]>;
export declare function createGetLiveCollection({
	liveCollections,
}: {
	liveCollections: LiveCollectionConfigMap;
}): (collection: string, filter?: Record<string, unknown>) => Promise<LiveDataCollectionResult>;
export declare function createGetLiveEntry({
	liveCollections,
}: {
	liveCollections: LiveCollectionConfigMap;
}): (collection: string, lookup: string | Record<string, unknown>) => Promise<LiveDataEntryResult>;
type RenderResult = {
	Content: AstroComponentFactory;
	headings: MarkdownHeading[];
	remarkPluginFrontmatter: Record<string, any>;
};
export declare function updateImageReferencesInData<T extends Record<string, unknown>>(
	data: T,
	fileName?: string,
	imageAssetMap?: Map<string, ImageMetadata>,
): T;
export declare function renderEntry(entry: DataEntry): Promise<RenderResult>;
export declare function createReference(): (collection: string) => z.ZodPipe<
	z.ZodUnion<
		readonly [
			z.ZodString,
			z.ZodObject<
				{
					id: z.ZodString;
					collection: z.ZodString;
				},
				z.core.$strip
			>,
			z.ZodObject<
				{
					slug: z.ZodString;
					collection: z.ZodString;
				},
				z.core.$strip
			>,
		]
	>,
	z.ZodTransform<
		| {
				id: string;
				collection: string;
		  }
		| {
				slug: string;
				collection: string;
		  }
		| undefined,
		| string
		| {
				id: string;
				collection: string;
		  }
		| {
				slug: string;
				collection: string;
		  }
	>
>;
export declare function defineCollection(config: any): import('./config.js').CollectionConfig<
	import('./config.js').BaseSchema,
	| import('./loaders/types.js').Loader
	| (() =>
			| {
					id: string;
			  }[]
			| Promise<
					{
						id: string;
					}[]
			  >
			| Record<
					string,
					Omit<
						{
							id: string;
						},
						'id'
					> & {
						id?: string;
					}
			  >
			| Promise<
					Record<
						string,
						Omit<
							{
								id: string;
							},
							'id'
						> & {
							id?: string;
						}
					>
			  >)
>;
export declare function defineLiveCollection(): void;
export declare function createDeprecatedFunction(
	functionName: string,
): (collection: string) => never;
