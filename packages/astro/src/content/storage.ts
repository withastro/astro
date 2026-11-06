import { AstroError, AstroErrorData } from '../core/errors/index.js';

/**
 * Describes the storage driver that keeps the entries of a build-time collection,
 * passed to the `storage` option of `defineCollection()`.
 *
 * The descriptor is written into the server bundle, so `config` must be JSON-serializable
 * and must not contain secrets.
 */
export interface CollectionStorageDescriptor<
	TConfig extends Record<string, unknown> = Record<string, unknown>,
> {
	/** URL or package specifier of a module whose default export creates the driver. */
	entrypoint: string | URL;
	/** Options passed to the driver factory. Must be JSON-serializable. */
	config?: TConfig;
}

/**
 * Validates the `storage` option of the collections in a content config.
 *
 * @throws {AstroError} `CollectionStorageDriversNotEnabled` when a collection sets `storage`
 * while `experimental.collectionStorageDrivers` is disabled.
 */
export function validateCollectionStorage(
	collections: Record<string, { type?: string; storage?: CollectionStorageDescriptor }>,
	enabled: boolean,
): void {
	if (enabled) return;
	for (const [name, collection] of Object.entries(collections)) {
		if (collection.storage) {
			throw new AstroError({
				...AstroErrorData.CollectionStorageDriversNotEnabled,
				message: AstroErrorData.CollectionStorageDriversNotEnabled.message(name),
			});
		}
	}
}
