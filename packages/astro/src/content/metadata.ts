import type {
	CollectionDescriptors,
	CollectionMetadata,
	JSONArray,
	JSONObject,
	JSONValue,
} from '@astrojs/internal-helpers/collections';

export type { CollectionDescriptors, CollectionMetadata, JSONArray, JSONObject, JSONValue };

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
	type: CollectionMetadata['type'],
): CollectionMetadata[] {
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
