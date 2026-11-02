import type {
	AnyCollectionMetadata,
	CollectionDescriptors,
	JSONArray,
	JSONObject,
	JSONValue,
} from '@astrojs/internal-helpers/collections';

export type { AnyCollectionMetadata, CollectionDescriptors, JSONArray, JSONObject, JSONValue };

/**
 * Narrows a union of collection metadata to the collections that have the descriptors `D`,
 * and optionally the collection type `T`.
 */
export type ExtractCollectionMetadata<
	M extends { type: 'build-time' | 'live'; descriptors: Record<string, unknown> },
	D extends CollectionDescriptors,
	T extends M['type'] = M['type'],
> = Extract<M, { type: T; descriptors: D }>;

interface CollectionWithDescriptors {
	type?: string;
	descriptors?: Record<string, unknown>;
	loader?: unknown;
}

/** Name of the loader of collections defined with a function instead of a loader object. */
const INLINE_LOADER_NAME = 'inline';

/** Returns the metadata of collections, in the order they are defined. */
export function getCollectionsMetadata(
	collections: Record<string, CollectionWithDescriptors>,
	type: AnyCollectionMetadata['type'],
): AnyCollectionMetadata[] {
	return Object.entries(collections).map(([name, collection]) => {
		const loader = collection.loader as
			| { name?: unknown; descriptors?: Record<string, unknown> }
			| undefined;
		const loaderName =
			typeof loader === 'object' && typeof loader?.name === 'string'
				? loader.name
				: INLINE_LOADER_NAME;
		return {
			name,
			type,
			loader: { name: loaderName },
			descriptors: {
				...(typeof loader === 'object' ? loader?.descriptors : undefined),
				...collection.descriptors,
			} as CollectionDescriptors,
		};
	});
}
