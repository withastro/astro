import type { InStatement } from '@libsql/client';
import { LibsqlError, createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { z } from 'zod';
import type { SqliteDB } from './index.js';
import { SEED_ERROR } from '../core/errors.js';
import type { DBTables } from '../core/types.js';
import { recreateTables } from './queries.js';

const isWebContainer = !!process.versions?.webcontainer;

interface LocalDatabaseClient extends LibSQLDatabase, Disposable {}

export async function createLocalDatabaseClient({
	dbUrl,
	seedProps,
}: {
	dbUrl: string;
	seedProps?: {
		tables: DBTables;
		fileGlob: Record<string, () => Promise<void>>;
	};
}): Promise<LocalDatabaseClient> {
	const url = isWebContainer ? 'file:content.db' : dbUrl;
	const client = createClient({ url });
	const db = Object.assign(drizzleLibsql(client), {
		[Symbol.dispose || Symbol.for('Symbol.dispose')]() {
			client.close();
		},
	});

	if (seedProps) {
		await seedLocal({ db, ...seedProps });
		console.log('seed finished');
	}

	return db;
}

/**
 * Sorted by precedence.
 * Ex. If both "seed.dev.ts" and "seed.ts" are present,
 * "seed.dev.ts" will be used.
 */
export const SEED_DEV_FILE_NAMES_SORTED = [
	'seed.development.ts',
	'seed.development.js',
	'seed.development.mjs',
	'seed.development.mts',
	'seed.dev.ts',
	'seed.dev.js',
	'seed.dev.mjs',
	'seed.dev.mts',
	'seed.ts',
	'seed.js',
	'seed.mjs',
	'seed.mts',
];

async function seedLocal({
	db,
	tables,
	// Glob all potential seed files to catch renames and deletions.
	fileGlob,
}: {
	db: SqliteDB;
	tables: DBTables;
	fileGlob: Record<string, () => Promise<void>>;
}) {
	await recreateTables({ db, tables });
	for (const fileName of SEED_DEV_FILE_NAMES_SORTED) {
		const key = Object.keys(fileGlob).find((f) => f.endsWith(fileName));
		if (key) {
			await fileGlob[key]().catch((e) => {
				if (e instanceof LibsqlError) {
					throw new Error(SEED_ERROR(e.message));
				}
				throw e;
			});
			return;
		}
	}
}

export function createRemoteDatabaseClient(appToken: string, remoteDbURL: string) {
	const url = new URL('/db/query', remoteDbURL);

	const db = drizzleProxy(async (sql, parameters, method) => {
		const requestBody: InStatement = { sql, args: parameters };
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${appToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});
		if (!res.ok) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: ${res.status} ${await res.text()}}`
			);
		}

		const queryResultSchema = z.object({
			rows: z.array(z.unknown()),
		});
		let rows: unknown[];
		try {
			const json = await res.json();
			rows = queryResultSchema.parse(json).rows;
		} catch (e) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: Unexpected JSON response. ${
					e instanceof Error ? e.message : String(e)
				}`
			);
		}

		// Drizzle expects each row as an array of its values
		const rowValues: unknown[][] = [];

		for (const row of rows) {
			if (row != null && typeof row === 'object') {
				rowValues.push(Object.values(row));
			}
		}

		if (method === 'get') {
			return { rows: rowValues[0] };
		}

		return { rows: rowValues };
	});

	(db as any).batch = (_drizzleQueries: Array<Promise<unknown>>) => {
		throw new Error('db.batch() is not currently supported.');
	};
	return db;
}
