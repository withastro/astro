import type { InStatement } from '@libsql/client';
import { createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { type SqliteRemoteDatabase, drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { z } from 'zod';
import { AstroDbError, safeFetch } from './utils.js';

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
				async (response) => {
					throw await parseRemoteError(response);
				}
			);

			let remoteResult: z.infer<typeof remoteResultSchema>;
			try {
				const json = await res.json();
				remoteResult = remoteResultSchema.parse(json);
			} catch (e) {
				throw new AstroDbError(await getUnexpectedResponseMessage(res));
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
				async (response) => {
					throw await parseRemoteError(response);
				}
			);

			let remoteResults: z.infer<typeof remoteResultSchema>[];
			try {
				const json = await res.json();
				remoteResults = z.array(remoteResultSchema).parse(json);
			} catch (e) {
				throw new AstroDbError(await getUnexpectedResponseMessage(res));
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

const errorSchema = z.object({
	success: z.boolean(),
	error: z.object({
		code: z.string(),
		details: z.string().optional(),
	}),
});

const KNOWN_ERROR_CODES = {
	SQL_QUERY_FAILED: 'SQL_QUERY_FAILED',
};

const getUnexpectedResponseMessage = async (response: Response) =>
	`Unexpected response from remote database:\n(Status ${response.status}) ${await response.text()}`;

async function parseRemoteError(response: Response): Promise<AstroDbError> {
	let error;
	try {
		error = errorSchema.parse(await response.json()).error;
	} catch (e) {
		return new AstroDbError(await getUnexpectedResponseMessage(response));
	}
	// Strip LibSQL error prefixes
	let details =
		error.details?.replace(/.*SQLite error: /, '') ??
		`(Code ${error.code}) \nError querying remote database.`;
	let hint = `See the Astro DB guide for query and push instructions: https://docs.astro.build/en/guides/astro-db/#query-your-database`;
	if (error.code === KNOWN_ERROR_CODES.SQL_QUERY_FAILED && details.includes('no such table')) {
		hint = `Did you run \`astro db push\` to push your latest table schemas?`;
	}
	return new AstroDbError(details, hint);
}
