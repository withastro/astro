import type { ContentStorageDriverConfig } from 'astro';
import { parseConfig, type SqliteContentStorageConfig } from './config.js';

/**
 * Returns the driver to set in `experimental.collectionStorage`, to save the collections
 * defined with `storage: 'external'` in a SQLite or libSQL database.
 *
 * ```js
 * // astro.config.mjs
 * import { createContentCollectionStorage } from '@astrojs/content-store-sqlite';
 *
 * export default defineConfig({
 *   experimental: {
 *     collectionStorage: {
 *       type: 'external',
 *       driver: createContentCollectionStorage({ url: 'file:content.db' }),
 *     },
 *   },
 * });
 * ```
 *
 * @throws {Error} When `url` is missing or empty.
 */
export function createContentCollectionStorage(
	config: SqliteContentStorageConfig,
): ContentStorageDriverConfig<SqliteContentStorageConfig> {
	return {
		entrypoint: new URL('./driver.js', import.meta.url),
		config: parseConfig(config),
	};
}

export type { SqliteContentStorageConfig };
