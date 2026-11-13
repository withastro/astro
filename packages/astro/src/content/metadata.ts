export type JSONValue = string | number | boolean | null | JSONArray | JSONObject;

// Interfaces, rather than type aliases, so TypeScript resolves the recursive members lazily
export interface JSONObject {
	[key: string]: JSONValue;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JSONArray extends Array<JSONValue> {}

/**
 * Serializable values attached to a collection by its loader or by `defineCollection()`, so
 * other code can recognize the collection without knowing its name.
 */
export type CollectionDescriptors = Record<string, JSONValue>;

/**
 * Narrows a union of collection metadata to the collections that have the descriptors `D`,
 * and optionally the collection type `T`.
 */
export type ExtractCollectionMetadata<
	M extends { type: 'build-time' | 'live'; descriptors: Record<string, unknown> },
	D extends CollectionDescriptors,
	T extends M['type'] = M['type'],
> = Extract<M, { type: T; descriptors: D }>;

/**
 * Facts about any collection, never its entries, with `name` as a `string` and untyped
 * descriptors. Integrations and Markdown plugins receive this shape, because a published package
 * can't see the collections of a project. In a project, `CollectionMetadata` from `astro:content`
 * has one variant for each collection, with its exact `name` and `descriptors`.
 */
export interface AnyCollectionMetadata {
	name: string;
	type: 'build-time' | 'live';
	loader: { name: string };
	/** Descriptors from the loader and from the collection config, the latter taking precedence. */
	descriptors: CollectionDescriptors;
}

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
