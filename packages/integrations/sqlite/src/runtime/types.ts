/** A value that can be bound to a SQL statement. Dates and booleans are normalized before binding. */
export type SqlValue = string | number | null;

/**
 * The minimal read interface the live loader needs at runtime. Each driver
 * provides an implementation for the environment it targets (Node's built-in
 * SQLite, Cloudflare D1, ...).
 */
export interface SqliteClient {
	/** Runs a query and resolves with every row as a plain object keyed by column name. */
	all(sql: string, params: SqlValue[]): Promise<Array<Record<string, unknown>>>;
}

/** Context handed to a driver's runtime `createClient()` by the virtual client module. */
export interface CreateClientContext {
	/** `import.meta.url` of the bundled module that created the client. */
	moduleUrl: string;
}

/**
 * Populated by the integration during `astro dev` and `astro build` (prerendering),
 * and looked up by the virtual client module before falling back to the driver's
 * runtime client.
 */
export interface LocalClientProvider {
	/** Resolves with a client for the local database, once it is in sync with the content layer. */
	get(): Promise<SqliteClient>;
}

export const LOCAL_CLIENT_PROVIDER_KEY = Symbol.for('@astrojs/sqlite:local-client-provider');
export const META_TABLE = 'astro_sqlite_meta';
/** Bumped when the table layout changes so stale local databases are rebuilt. */
export const SCHEMA_VERSION = '1';
