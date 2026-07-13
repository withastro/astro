/**
 * Non-enumerable marker used to tag the objects produced by `reference()`, so the
 * content layer can tell a genuine reference apart from ordinary data that merely
 * happens to have a `{ collection, id }` / `{ collection, slug }` shape.
 *
 * It is non-enumerable on purpose: it stays invisible to `JSON.stringify`,
 * `Object.keys`, spreads and – crucially – to `devalue`, which the data store uses to
 * persist entries (and which throws on symbol keys). The marker therefore never leaks
 * into the serialized store or into user-facing data at render time; it only lives on
 * the in-memory object during a sync, which is exactly when references are validated.
 *
 * This lives in its own dependency-free module so that the content layer can read the
 * marker without importing `runtime.js` (which would pull the whole SSR runtime graph
 * into the build/sync module graph).
 */
const REFERENCE_MARKER = '__isAstroContentReference';

export function markReference<T extends object>(value: T): T {
	Object.defineProperty(value, REFERENCE_MARKER, {
		value: true,
		enumerable: false,
		configurable: true,
		writable: true,
	});
	return value;
}

/**
 * Returns `true` only for values produced by `reference()`. Matching on the marker
 * (rather than on the object shape) avoids false positives on ordinary data such as
 * `metadata: { collection: "authors", id: "external-id" }` that never went through a
 * `reference()` schema. The check reads a plain string-keyed property, so it works even
 * when `reference()` and the validator resolve to different module instances.
 */
export function isContentReference(
	value: unknown,
): value is { collection: string; id?: string; slug?: string } {
	return typeof value === 'object' && value !== null && (value as any)[REFERENCE_MARKER] === true;
}
