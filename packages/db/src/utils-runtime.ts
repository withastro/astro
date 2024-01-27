import type { InStatement } from '@libsql/client';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { z } from 'zod';
import { DB_PATH } from './consts.js';

export function findLocalDatabase(localDbURL: string): string {
	let dbURL: URL | undefined = undefined;
	if (process.env.VERCEL) {
		dbURL = new URL(DB_PATH, 'file://' + process.cwd() + '/vercel/path0/');
	} else {
		dbURL = new URL(localDbURL);
	}

	return dbURL.toString();
}

export function createRemoteDatabaseClient(appToken: string, remoteDbURL: string) {
	const url = new URL('./db/query/', remoteDbURL);

	const db = drizzle(async (sql, parameters, method) => {
		const requestBody: InStatement = { sql, args: parameters };
		// eslint-disable-next-line no-console
		console.info(JSON.stringify(requestBody));
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
	return db;
}
