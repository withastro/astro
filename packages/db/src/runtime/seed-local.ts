import { LibsqlError } from '@libsql/client';
import { type SQL, sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { type DBTables } from '../core/types.js';
import { SEED_DEFAULT_EXPORT_ERROR, SEED_ERROR } from './errors.js';
import { getCreateIndexQueries, getCreateTableQuery } from './queries.js';

const sqlite = new SQLiteAsyncDialect();

export async function seedLocal({
	db,
	tables,
	// Glob all potential seed files to catch renames and deletions.
	userSeedGlob,
	integrationSeedFunctions,
}: {
	db: LibSQLDatabase;
	tables: DBTables;
	userSeedGlob: Record<string, { default?: () => Promise<void> }>;
	integrationSeedFunctions: Array<() => Promise<void>>;
}) {
	await recreateTables({ db, tables });
	const seedFunctions: Array<() => Promise<void>> = [];
	const seedFilePath = Object.keys(userSeedGlob)[0];
	if (seedFilePath) {
		const mod = userSeedGlob[seedFilePath];
		if (!mod.default) throw new Error(SEED_DEFAULT_EXPORT_ERROR(seedFilePath));
		seedFunctions.push(mod.default);
	}
	for (const seedFn of integrationSeedFunctions) {
		seedFunctions.push(seedFn);
	}
	for (const seed of seedFunctions) {
		try {
			await seed();
		} catch (e) {
			if (e instanceof LibsqlError) {
				throw new Error(SEED_ERROR(e.message));
			}
			throw e;
		}
	}
}

async function recreateTables({ db, tables }: { db: LibSQLDatabase; tables: DBTables }) {
	const setupQueries: SQL[] = [];
	for (const [name, table] of Object.entries(tables)) {
		const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${sqlite.escapeName(name)}`);
		const createQuery = sql.raw(getCreateTableQuery(name, table));
		const indexQueries = getCreateIndexQueries(name, table);
		setupQueries.push(dropQuery, createQuery, ...indexQueries.map((s) => sql.raw(s)));
	}
	await db.batch([
		db.run(sql`pragma defer_foreign_keys=true;`),
		...setupQueries.map((q) => db.run(q)),
	]);
}
