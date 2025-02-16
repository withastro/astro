import assert from "node:assert";
import { SqliteBackendBase } from "./sqliteBase.js";
import type { GenericTransaction } from "./types.js";
import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { sql } from "drizzle-orm";

type Configuration = {
	remoteUrl?: string;
	localFile: string;
	options?: Omit<Parameters<typeof createClient>[0], 'url' | 'fetch'>
};

export class LibsqlBackend extends SqliteBackendBase {
	private localDb?: LibSQLDatabase;
	private remoteDb?: LibSQLDatabase;

	constructor(private readonly config: Configuration) {
		super();
	}

	private getDb(target: 'local' | 'remote'): LibSQLDatabase {
		if (target === 'local') {
			if (!this.localDb) {
				this.localDb = drizzle(createClient({
					url: `file:${this.config.localFile}`,
					...this.config.options,
				}));
			}
			return this.localDb;
		} else {
			if (!this.remoteDb) {
				assert.ok(this.config.remoteUrl, 'remoteUrl is required for remote connections');

				this.remoteDb = drizzle(createClient({
					url: this.config.remoteUrl,
					...this.config.options,
				}));
			}
			return this.remoteDb;
		}
	}

	protected runInTransaction(
		target: "local" | "remote",
		callback: (tx: GenericTransaction) => Promise<void>
	): Promise<void> {
		const db = this.getDb(target);

		return db.transaction(async (tx) => {
			await callback({
				run: async (query) => {
					await tx.run(typeof query === 'string' ? sql.raw(query) : query)
				},
			});
		});
	}

	getDbExportModule(target: "local" | "remote"): string {
		throw new Error("Method not implemented.");
	}
	getTypeDeclarations(): string {
		throw new Error("Method not implemented.");
	}
}
