import type { DBCollections } from '../../types.js';
import yargs from 'yargs-parser';
import { appTokenError } from '../../errors.js';
import {
	getAstroStudioEnv,
	getStudioUrl,
	getRemoteDatabaseUrl,
	isAppTokenValid,
} from '../../utils.js';
import { migrate } from './migrate.js';
import { collectionToTable, createDb } from '../../internal.js';
import type { Query } from 'drizzle-orm';
import type { InArgs, InStatement } from '@libsql/client';

export async function sync({ collections }: { collections: DBCollections }) {
	const args = yargs(process.argv.slice(3), {
		string: ['dry-run', 'seed'],
	});
	const isDryRun = 'dry-run' in args;
	const shouldSeed = 'seed' in args;
	const remoteDbUrl = getRemoteDatabaseUrl();

	const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
	if (!appToken || !(await isAppTokenValid({ remoteDbUrl, appToken }))) {
		// eslint-disable-next-line no-console
		console.error(appTokenError);
		process.exit(1);
	}

	try {
		await setSyncStatus({ status: 'RUNNING', remoteDbUrl, appToken });
		await migrate({ collections, isDryRun, appToken });
		await setSyncStatus({ status: 'SUCCESS', remoteDbUrl, appToken });
		if (shouldSeed) {
			await tempDataPush({ collections, appToken, isDryRun });
		}
		// eslint-disable-next-line no-console
		console.info('Sync complete 🔄');
	} catch (e) {
		await setSyncStatus({ status: 'FAILED', remoteDbUrl, appToken });
		// eslint-disable-next-line no-console
		console.error(e);
		return;
	}
}

/** TODO: refine with migration changes */
async function tempDataPush({
	collections,
	appToken,
	isDryRun,
}: {
	collections: DBCollections;
	appToken: string;
	isDryRun?: boolean;
}) {
	const db = await createDb({ collections, dbUrl: ':memory:', seeding: true });
	const queries: Query[] = [];

	for (const [name, collection] of Object.entries(collections)) {
		if (collection.writable || !collection.data) continue;
		const table = collectionToTable(name, collection);
		const insert = db.insert(table).values(await collection.data());

		queries.push(insert.toSQL());
	}
	const url = new URL('/db/query', getRemoteDatabaseUrl());
	const requestBody: InStatement[] = queries.map((q) => ({
		sql: q.sql,
		args: q.params as InArgs,
	}));

	if (isDryRun) {
		console.info('[DRY RUN] Batch data seed:', JSON.stringify(requestBody, null, 2));
		return new Response(null, { status: 200 });
	}

	return await fetch(url, {
		method: 'POST',
		headers: new Headers({
			Authorization: `Bearer ${appToken}`,
		}),
		body: JSON.stringify(requestBody),
	});
}

async function setSyncStatus({
	remoteDbUrl,
	appToken,
	status,
}: {
	remoteDbUrl: string;
	appToken: string;
	status: 'RUNNING' | 'FAILED' | 'SUCCESS';
}) {
	const syncStatusUrl = new URL('/api/rest/sync-status', getStudioUrl());
	syncStatusUrl.searchParams.set('workerUrl', remoteDbUrl);
	syncStatusUrl.searchParams.set('status', status);

	const response = await fetch(syncStatusUrl, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${appToken}`,
		},
	});

	if (!response.ok) {
		// eslint-disable-next-line no-console
		console.error('Unexpected problem completing sync.');
		process.exit(1);
	}
}
