import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import type { SqliteClient, SqlValue } from '../runtime/types.js';
import type { SqlExecutor } from './sync.js';

/** The local SQLite file the integration writes to during `astro dev` and `astro build`. */
export class LocalDatabase {
	readonly path: string;
	#db: DatabaseSync;

	constructor(file: URL) {
		mkdirSync(new URL('./', file), { recursive: true });
		this.path = fileURLToPath(file);
		this.#db = new DatabaseSync(this.path);
		this.#db.exec('PRAGMA journal_mode = WAL');
	}

	get executor(): SqlExecutor {
		return {
			query: async (sql, params = []) =>
				this.#db.prepare(sql).all(...params) as Array<Record<string, unknown>>,
			execute: async (statements) => {
				if (statements.length === 0) return;
				this.#db.exec('BEGIN');
				try {
					for (const statement of statements) this.#db.exec(statement);
					this.#db.exec('COMMIT');
				} catch (error) {
					this.#db.exec('ROLLBACK');
					throw error;
				}
			},
		};
	}

	get client(): SqliteClient {
		return {
			all: async (sql: string, params: SqlValue[]) =>
				this.#db.prepare(sql).all(...params) as Array<Record<string, unknown>>,
		};
	}

	close() {
		this.#db.close();
	}
}
