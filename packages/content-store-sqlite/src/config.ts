export interface SqliteContentStorageConfig {
	/**
	 * The URL of the database: `file:` followed by a path for a local SQLite file, for example
	 * `file:content.db`, or the URL of a remote libSQL database such as Turso. Relative paths
	 * start from the directory where Astro runs.
	 */
	url: string;
	/** The token to connect to a remote libSQL database */
	token?: string;
}

/**
 * Checks the config received by the driver.
 *
 * @throws {Error} When `url` is missing or empty.
 */
export function parseConfig(config: unknown): SqliteContentStorageConfig {
	const { url, token } = (config ?? {}) as Partial<SqliteContentStorageConfig>;
	if (typeof url !== 'string' || url === '') {
		throw new Error(
			'The SQLite content storage driver needs the URL of a database. Pass `url` to `createContentCollectionStorage()`.',
		);
	}
	if (token === undefined) {
		return { url };
	}
	if (typeof token !== 'string') {
		throw new Error('The `token` of the SQLite content storage driver must be a string.');
	}
	return { url, token };
}
