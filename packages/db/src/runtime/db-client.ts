import type { InStatement, ResultSet } from '@libsql/client';
import { createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';

const isWebContainer = !!process.versions?.webcontainer;

interface LocalDatabaseClient extends LibSQLDatabase, Disposable {}

export async function createLocalDatabaseClient({
	dbUrl,
}: {
	dbUrl: string;
}): Promise<LocalDatabaseClient> {
	const url = isWebContainer ? 'file:content.db' : dbUrl;
	const client = createClient({ url });
	const db = Object.assign(drizzleLibsql(client), {
		[Symbol.dispose || Symbol.for('Symbol.dispose')]() {
			client.close();
		},
	});

	return db;
}

export function createRemoteDatabaseClient(appToken: string, remoteDbURL: string) {
	const url = new URL('/db/query', remoteDbURL);

	const db = drizzleProxy(async (sql, parameters, method) => {
		const context = batchContext.getStore();
		if (context) {
			context.queries.push({ sql, args: parameters });
			return { rows: [] };
		}
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

	const batchContext = new AsyncLocalStorage<{ queries: InStatement[] }>();
	(db as any).batch = (drizzleQueries: Array<Promise<unknown>>) => {
		return batchContext.run({ queries: [] }, async () => {
			await Promise.all(drizzleQueries);

			const { queries } = batchContext.getStore()!;
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${appToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(queries),
			});
			if (!res.ok) {
				throw new Error(
					`Failed to execute batch queries.\nFull error: ${res.status} ${await res.text()}}`
				);
			}

			const queryResultSchema = z.array(
				z.object({
					columns: z.array(z.string()),
					columnTypes: z.array(z.string()),
					rows: z.array(z.array(z.unknown())),
					rowsAffected: z.number(),
					lastInsertRowid: z.unknown().optional(),
				})
			);

			try {
				const json = await res.json();
				const rawResults = queryResultSchema.parse(json);
				let results: unknown[] = [];
				for (const rawResult of rawResults) {
					const ignoreReturning = rawResult.rows.length === 0 && rawResult.rowsAffected > 0;
					if (ignoreReturning) {
						results.push(rawResult);
						continue;
					}
					const rows = rawResult.rows.map((row) => {
						let obj: Record<string, unknown> = {};
						for (const [idx, column] of rawResult.columns.entries()) {
							obj[column] = row[idx];
						}
						return obj;
					});
					results.push(rows);
				}
				return results;
			} catch (e) {
				throw new Error(
					`Failed to execute batch queries.\nFull error: Unexpected JSON response. ${
						e instanceof Error ? e.message : String(e)
					}`
				);
			}
		});
	};
	return db;
}
