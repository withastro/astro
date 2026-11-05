import type { CollectionStorageDescriptor } from 'astro';

export type SqliteConfig = {
	/**
	 * The URL of the database: `file:` followed by a path for a local SQLite file, for example
	 * `file:.astro/collections.db`, or the `libsql://` or `https://` URL of a remote database
	 * such as Turso. Relative paths start from the directory where Astro runs.
	 */
	url: string;
	/**
	 * The name of the environment variable that holds the auth token of a remote database.
	 * The driver reads it with `getSecret()` from `astro:env/server` when it starts, so the token
	 * is never written into your build.
	 */
	authTokenEnv?: string;
};

/**
 * Keeps a collection's entries in a SQLite or libSQL database. Pass the result to the
 * `storage` option of `defineCollection()`.
 */
export function sqlite(config: SqliteConfig): CollectionStorageDescriptor<SqliteConfig> {
	return {
		entrypoint: new URL('./driver.js', import.meta.url),
		config: { ...config },
	};
}
