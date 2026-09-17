import type { SqliteClient, SqlValue } from './types.js';

export interface D1ClientOptions {
	/** Name of the D1 binding in the Worker's environment. */
	binding: string;
}

interface D1PreparedStatement {
	bind(...params: SqlValue[]): D1PreparedStatement;
	all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

interface D1Database {
	prepare(sql: string): D1PreparedStatement;
}

/** A client that queries a D1 database through the Worker's `env` binding. */
export function createClient(options: D1ClientOptions): SqliteClient {
	let database: D1Database | undefined;
	const open = async () => {
		if (database) return database;
		const { env } = await import('cloudflare:workers');
		const binding = (env as Record<string, unknown>)[options.binding];
		if (!binding || typeof (binding as D1Database).prepare !== 'function') {
			throw new Error(
				`[@astrojs/sqlite] No D1 binding named "${options.binding}" was found in the Worker environment. Add a "d1_databases" entry with that binding name to your Wrangler config.`,
			);
		}
		database = binding as D1Database;
		return database;
	};
	return {
		async all(sql, params) {
			const db = await open();
			const { results } = await db
				.prepare(sql)
				.bind(...params)
				.all();
			return results;
		},
	};
}
