/**
 * Tag applied to the Zod schema returned by `reference()`, recording the collection
 * it points at. The content layer reads it to tell a genuine reference field apart
 * from ordinary data that merely happens to have a `{ collection, id }` /
 * `{ collection, slug }` shape.
 *
 * Provenance lives on the *schema*, not on the parsed value, on purpose. The schema is
 * rebuilt from the content config on every sync and is never serialized, so the tag is
 * always available while references are validated — including for cached entries whose
 * data was restored from the persisted store. Tagging the value instead (e.g. a
 * non-enumerable marker) does not survive the `devalue` round-trip the data store uses
 * to persist entries, so a reference on an unchanged, cached entry would silently lose
 * its provenance and escape validation.
 *
 * A registered `Symbol` keeps the tag off enumerable data and lets the content layer
 * read it even when `reference()` and the validator resolve to different module
 * instances. This lives in its own dependency-free module so the content layer can read
 * the tag without importing `runtime.js` (which would pull the whole SSR runtime graph
 * into the build/sync module graph).
 */
const REFERENCE_COLLECTION = Symbol.for('astro:content:reference-collection');

export function markReferenceSchema<T extends object>(schema: T, collection: string): T {
	Object.defineProperty(schema, REFERENCE_COLLECTION, {
		value: collection,
		enumerable: false,
		configurable: true,
		writable: true,
	});
	return schema;
}

/**
 * Returns the target collection for a schema produced by `reference()`, or `undefined`
 * for any other schema. Matching on the tag (rather than on the object shape) avoids
 * false positives on ordinary data such as `metadata: { collection: "authors", id:
 * "external-id" }` whose field never went through a `reference()` schema.
 */
export function getReferenceCollection(schema: unknown): string | undefined {
	if (typeof schema !== 'object' || schema === null) return undefined;
	const collection = (schema as Record<symbol, unknown>)[REFERENCE_COLLECTION];
	return typeof collection === 'string' ? collection : undefined;
}
