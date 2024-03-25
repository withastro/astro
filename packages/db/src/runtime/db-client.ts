import type { InStatement } from '@libsql/client';
import { createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { type SqliteRemoteDatabase, drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { z } from 'zod';
import { safeFetch } from './utils.js';

const isWebContainer = !!process.versions?.webcontainer;

function applyTransactionNotSupported(db: SqliteRemoteDatabase) {
	Object.assign(db, {
		transaction() {
			throw new Error(
				'`db.transaction()` is not currently supported. We recommend `db.batch()` for automatic error rollbacks across multiple queries.'
			);
		},
	});
}

export function createLocalDatabaseClient({ dbUrl }: { dbUrl: string }): LibSQLDatabase {
	const url = isWebContainer ? 'file:content.db' : dbUrl;
	const client = createClient({ url });
	const db = drizzleLibsql(client);

	applyTransactionNotSupported(db);
	return db;
}

const remoteResultSchema = z.object({
	columns: z.array(z.string()),
	columnTypes: z.array(z.string()),
	rows: z.array(z.array(z.unknown())),
	rowsAffected: z.number(),
	lastInsertRowid: z.unknown().optional(),
});

export function createRemoteDatabaseClient(appToken: string, remoteDbURL: string) {
	if (appToken == null) {
		throw new Error(`Cannot create a remote client: missing app token.`);
	}

	const url = new URL('/db/query', remoteDbURL);

	const db = drizzleProxy(
		async (sql, parameters, method) => {
			const requestBody: InStatement = { sql, args: parameters };
			const res = await safeFetch(
				url,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${appToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				},
				(response) => {
					throw new Error(
						`Failed to execute query.\nQuery: ${sql}\nFull error: ${response.status} ${response.statusText}`
					);
				}
			);

			let remoteResult: z.infer<typeof remoteResultSchema>;
			try {
				const json = await res.json();
				remoteResult = remoteResultSchema.parse(json);
			} catch (e) {
				throw new Error(
					`Failed to execute query.\nQuery: ${sql}\nFull error: Unexpected JSON response. ${
						e instanceof Error ? e.message : String(e)
					}`
				);
			}

			if (method === 'run') return remoteResult;

			// Drizzle expects each row as an array of its values
			const rowValues: unknown[][] = [];

			for (const row of remoteResult.rows) {
				if (row != null && typeof row === 'object') {
					rowValues.push(Object.values(row));
				}
			}

			if (method === 'get') {
				return { rows: rowValues[0] };
			}

			return { rows: rowValues };
		},
		async (queries) => {
			const stmts: InStatement[] = queries.map(({ sql, params }) => ({ sql, args: params }));
			const res = await safeFetch(
				url,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${appToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(stmts),
				},
				(response) => {
					throw new Error(
						`Failed to execute batch queries.\nFull error: ${response.status} ${response.statusText}}`
					);
				}
			);

			let remoteResults: z.infer<typeof remoteResultSchema>[];
			try {
				const json = await res.json();
				remoteResults = z.array(remoteResultSchema).parse(json);
			} catch (e) {
				throw new Error(
					`Failed to execute batch queries.\nFull error: Unexpected JSON response. ${
						e instanceof Error ? e.message : String(e)
					}`
				);
			}
			let results: any[] = [];
			for (const [idx, rawResult] of remoteResults.entries()) {
				if (queries[idx]?.method === 'run') {
					results.push(rawResult);
					continue;
				}

				// Drizzle expects each row as an array of its values
				const rowValues: unknown[][] = [];

				for (const row of rawResult.rows) {
					if (row != null && typeof row === 'object') {
						rowValues.push(Object.values(row));
					}
				}

				if (queries[idx]?.method === 'get') {
					results.push({ rows: rowValues[0] });
				}

				results.push({ rows: rowValues });
			}
			return results;
		}
	);
	applyTransactionNotSupported(db);
	return db;
}
