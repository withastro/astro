import { createClient } from '@libsql/client';
import type { DBCollections } from 'circle-rhyme-yes-measure';
import { type SQL, sql } from 'drizzle-orm';
import { LibSQLDatabase, drizzle } from 'drizzle-orm/libsql';
import { getCreateTableQuery } from './cli/sync/queries.js';

export async function createLocalDb(collections: DBCollections) {
	const client = createClient({ url: ':memory:' });
	const db = drizzle(client);

	await createDbTables(db, collections);
	return db;
}

async function createDbTables(db: LibSQLDatabase, collections: DBCollections) {
	const setupQueries: SQL[] = [];
	for (const [name, collection] of Object.entries(collections)) {
		const dropQuery = sql.raw(`DROP TABLE IF EXISTS ${name}`);
		const createQuery = sql.raw(getCreateTableQuery(name, collection));
		setupQueries.push(dropQuery, createQuery);
	}
	for (const q of setupQueries) {
		await db.run(q);
	}
}
