import type { InArgs, InStatement } from '@libsql/client';
import {
	STUDIO_ADMIN_TABLE_ROW_ID,
	adminTable,
} from './admin.js';
import { type SQL, eq, sql } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import { red } from 'kleur/colors';
import { collectionsSchema, type DBCollections } from '../../types.js';
import { getRemoteDatabaseUrl } from '../../utils.js';
import { authenticationError, unexpectedAstroAdminError } from '../../errors.js';
import { createDb } from './remote-db.js';
import { getMigrationQueries } from './queries.js';

const sqliteDialect = new SQLiteAsyncDialect();

export async function migrate({
	collections: newCollections,
	appToken,
	isDryRun,
}: {
	collections: DBCollections;
	appToken: string;
	isDryRun?: boolean;
}) {
	const db = createDb(appToken);
	const adminEntry = await db
		.select({ collections: adminTable.collections })
		.from(adminTable)
		.get();

	if (!adminEntry) {
		// eslint-disable-next-line no-console
		console.error(
			`${red(
				'⚠️ Unexpected error syncing collections.',
			)} You may need to initialize a new project with \`studio init\`.`,
		);
		process.exit(1);
	}

	if (JSON.stringify(newCollections) === adminEntry.collections) {
		// eslint-disable-next-line no-console
		console.info('Collections already up to date');
		return;
	}

	const oldCollections = collectionsSchema.parse(
		adminEntry.collections ? JSON.parse(adminEntry.collections) : {},
	);
	const queries: SQL[] = [];
	const migrationQueries = await getMigrationQueries({ oldCollections, newCollections });
	queries.push(...migrationQueries.map((q) => sql.raw(q)));

	const updateCollectionsJson = db
		.update(adminTable)
		.set({ collections: JSON.stringify(newCollections) })
		.where(eq(adminTable.id, STUDIO_ADMIN_TABLE_ROW_ID))
		.getSQL();
	queries.push(updateCollectionsJson);

	const res = await runBatchQuery({ queries, appToken, isDryRun });
	if (!res.ok) {
		if (res.status === 401) {
			// eslint-disable-next-line no-console
			console.error(authenticationError);
			process.exit(1);
		}

		// eslint-disable-next-line no-console
		console.error(unexpectedAstroAdminError);
		process.exit(1);
	}
}

async function runBatchQuery({
	queries: sqlQueries,
	appToken,
	isDryRun,
}: {
	queries: SQL[];
	appToken: string;
	isDryRun?: boolean;
}) {
	const queries = sqlQueries.map((q) => sqliteDialect.sqlToQuery(q));
	const requestBody: InStatement[] = queries.map((q) => ({
		sql: q.sql,
		args: q.params as InArgs,
	}));

	if (isDryRun) {
		console.info('[DRY RUN] Batch query:', JSON.stringify(requestBody, null, 2));
		return new Response(null, { status: 200 });
	}

	const url = new URL('/db/query', getRemoteDatabaseUrl());

	return await fetch(url, {
		method: 'POST',
		headers: new Headers({
			Authorization: `Bearer ${appToken}`,
		}),
		body: JSON.stringify(requestBody),
	});
}
