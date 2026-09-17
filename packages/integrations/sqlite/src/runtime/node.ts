import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CreateClientContext, SqliteClient, SqlValue } from './types.js';

export interface NodeClientOptions {
	/**
	 * The database file. Either an absolute path, or a file name that is looked up
	 * by walking up the directories from the module that created the client. The
	 * latter is what the build uses, because the server bundle can be deployed
	 * anywhere.
	 */
	path: string;
}

/** Opens a read-only client over Node's built-in SQLite. */
export function createClient(
	options: NodeClientOptions,
	context?: CreateClientContext,
): SqliteClient {
	let database: import('node:sqlite').DatabaseSync | undefined;
	const open = async () => {
		if (database) return database;
		const { DatabaseSync } = await import('node:sqlite');
		const path = resolveDatabasePath(options.path, context?.moduleUrl);
		database = new DatabaseSync(path, { readOnly: true });
		return database;
	};
	return {
		async all(sql: string, params: SqlValue[]) {
			const db = await open();
			return db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
		},
	};
}

function resolveDatabasePath(path: string, moduleUrl: string | undefined): string {
	if (path.startsWith('file:')) return fileURLToPath(path);
	if (!moduleUrl || path.includes('/') || path.includes('\\')) return path;
	let dir = dirname(fileURLToPath(moduleUrl));
	let previous = '';
	while (dir !== previous) {
		const candidate = join(dir, path);
		if (existsSync(candidate)) return candidate;
		previous = dir;
		dir = dirname(dir);
	}
	throw new Error(
		`[@astrojs/sqlite] Could not find the database file "${path}" next to the server bundle (searched upwards from ${moduleUrl}). Was it removed after the build?`,
	);
}
