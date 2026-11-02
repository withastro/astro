export type JSONValue = string | number | boolean | null | JSONArray | JSONObject;

// Interfaces, rather than type aliases, so TypeScript resolves the recursive members lazily
export interface JSONObject {
	[key: string]: JSONValue;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JSONArray extends Array<JSONValue> {}

/**
 * Serializable values attached to a content collection by its loader or by its config, so
 * other code can recognize the collection without knowing its name.
 */
export type CollectionDescriptors = Record<string, JSONValue>;

/**
 * Facts about any content collection, never its entries, with `name` as a `string` and untyped
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
