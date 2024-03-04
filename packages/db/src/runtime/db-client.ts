import type { InStatement } from '@libsql/client';
import { createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { z } from 'zod';

const isWebContainer = !!process.versions?.webcontainer;

export function createLocalDatabaseClient({ dbUrl }: { dbUrl: string }): LibSQLDatabase {
	const url = isWebContainer ? 'file:content.db' : dbUrl;
	console.log('memory', process.env.TEST_IN_MEMORY_DB);
	const client = createClient({ url: process.env.TEST_IN_MEMORY_DB ? ':memory:' : url });
	const db = drizzleLibsql(client);

	return db;
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
