import { createClient, type InStatement } from '@libsql/client';
import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import type { Arguments } from 'yargs-parser';
import type { AstroConfigWithDB } from '../../../types.js';
import { appTokenError } from '../../../errors.js';
import {
	createCurrentSnapshot,
	createEmptySnapshot,
	getMigrations,
	initializeFromMigrations,
	loadInitialSnapshot,
	loadMigration,
} from '../../migrations.js';
import type { DBSnapshot } from '../../../types.js';
import { getAstroStudioEnv, getRemoteDatabaseUrl } from '../../../utils.js';
import { getMigrationQueries } from '../../migration-queries.js';
import { setupDbTables } from '../../../queries.js';

const { diff } = deepDiff;

export async function cmd({ config, flags }: { config: AstroConfig; flags: Arguments }) {
	const isSeedData = flags.seed;
	const isDryRun = flags.dryRun;
	const appToken = flags.token ?? getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
	const currentSnapshot = createCurrentSnapshot(config);
	const allMigrationFiles = await getMigrations();
	if (allMigrationFiles.length === 0) {
		console.log('Project not yet initialized!');
		process.exit(1);
	}

	const prevSnapshot = await initializeFromMigrations(allMigrationFiles);
	const calculatedDiff = diff(prevSnapshot, currentSnapshot);
	if (calculatedDiff) {
		console.log('Changes detected!');
		console.log(calculatedDiff);
		process.exit(1);
	}
	if (!appToken) {
		console.error(appTokenError);
		process.exit(1);
	}
	// get all migrations from the filesystem
	const allLocalMigrations = await getMigrations();
	const { data: missingMigrations } = await prepareMigrateQuery({
		migrations: allLocalMigrations,
		appToken,
	});
	// exit early if there are no migrations to push
	if (missingMigrations.length === 0) {
		console.info('No migrations to push! Your database is up to date!');
		process.exit(0);
	}
	// push the database schema
	if (missingMigrations.length > 0) {
		console.log(`Pushing ${missingMigrations.length} migrations...`);
		await pushSchema({ migrations: missingMigrations, appToken, isDryRun, currentSnapshot });
	}
	// push the database seed data
	if (isSeedData) {
		console.info('Pushing data...');
		await pushData({ config, appToken, isDryRun });
	}
	console.info('Push complete!');
}

async function pushSchema({
	migrations,
	appToken,
	isDryRun,
	currentSnapshot,
}: {
	migrations: string[];
	appToken: string;
	isDryRun: boolean;
	currentSnapshot: DBSnapshot;
}) {
	// load all missing migrations
	const initialSnapshot = migrations.find((m) => m === '0000_snapshot.json');
	const filteredMigrations = migrations.filter((m) => m !== '0000_snapshot.json');
	const missingMigrationContents = await Promise.all(filteredMigrations.map(loadMigration));
	// create a migration for the initial snapshot, if needed
	const initialMigrationBatch = initialSnapshot
		? await getMigrationQueries({
				oldSnapshot: createEmptySnapshot(),
				newSnapshot: await loadInitialSnapshot(),
			})
		: [];
	// combine all missing migrations into a single batch
	const queries = missingMigrationContents.reduce((acc, curr) => {
		return [...acc, ...curr.db];
	}, initialMigrationBatch);
	// apply the batch to the DB
	await runMigrateQuery({ queries, migrations, snapshot: currentSnapshot, appToken, isDryRun });
}

async function pushData({
	config,
	appToken,
	isDryRun,
}: {
	config: AstroConfigWithDB;
	appToken: string;
	isDryRun?: boolean;
}) {
	const queries: InStatement[] = [];
	if (config.db?.data) {
		const libsqlClient = createClient({ url: ':memory:' });
		// Use proxy to trace all queries to queue up in a batch
		const db = await drizzle(async (sqlQuery, params, method) => {
			const stmt: InStatement = { sql: sqlQuery, args: params };
			queries.push(stmt);
			// Use in-memory database to generate results for `returning()`
			const { rows } = await libsqlClient.execute(stmt);
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
		await setupDbTables({
			db,
			mode: 'build',
			collections: config.db.collections ?? {},
			data: config.db.data,
		});
	}

	const url = new URL('/db/query', getRemoteDatabaseUrl());

	if (isDryRun) {
		console.info('[DRY RUN] Batch data seed:', JSON.stringify(queries, null, 2));
		return new Response(null, { status: 200 });
	}

	return await fetch(url, {
		method: 'POST',
		headers: new Headers({
			Authorization: `Bearer ${appToken}`,
		}),
		body: JSON.stringify(queries),
	});
}

async function runMigrateQuery({
	queries,
	migrations,
	snapshot,
	appToken,
	isDryRun,
}: {
	queries: string[];
	migrations: string[];
	snapshot: DBSnapshot;
	appToken: string;
	isDryRun?: boolean;
}) {
	const requestBody = {
		snapshot,
		migrations,
		sql: queries,
		experimentalVersion: 1,
	};

	if (isDryRun) {
		console.info('[DRY RUN] Batch query:', JSON.stringify(requestBody, null, 2));
		return new Response(null, { status: 200 });
	}

	const url = new URL('/db/migrate/run', getRemoteDatabaseUrl());

	return await fetch(url, {
		method: 'POST',
		headers: new Headers({
			Authorization: `Bearer ${appToken}`,
		}),
		body: JSON.stringify(requestBody),
	});
}

async function prepareMigrateQuery({
	migrations,
	appToken,
}: {
	migrations: string[];
	appToken: string;
}) {
	const url = new URL('/db/migrate/prepare', getRemoteDatabaseUrl());
	const requestBody = {
		migrations,
		experimentalVersion: 1,
	};
	const result = await fetch(url, {
		method: 'POST',
		headers: new Headers({
			Authorization: `Bearer ${appToken}`,
		}),
		body: JSON.stringify(requestBody),
	});
	if (result.status >= 400) {
		throw new Error(await result.text())
	}
	return await result.json();
}
