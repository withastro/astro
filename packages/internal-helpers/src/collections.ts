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

/** Facts about a content collection, never its entries. */
export interface CollectionMetadata {
	name: string;
	type: 'build-time' | 'live';
	loader: { name: string };
	/** Descriptors from the loader and from the collection config, the latter taking precedence. */
	descriptors: CollectionDescriptors;
}
