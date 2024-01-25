import type { InArgs, InStatement } from '@libsql/client';
import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { type SQL, eq, type Query, sql } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import type { Arguments } from 'yargs-parser';
import { appTokenError } from '../../../errors.js';
import { collectionToTable, createLocalDatabaseClient } from '../../../internal.js';
import {
	createCurrentSnapshot,
	createEmptySnapshot,
	getMigrations,
	initializeFromMigrations,
	loadInitialSnapshot,
	loadMigration,
} from '../../../migrations.js';
import type { DBCollections, DBSnapshot } from '../../../types.js';
import {
	STUDIO_ADMIN_TABLE_ROW_ID,
	adminTable,
	createRemoteDatabaseClient,
	getAstroStudioEnv,
	getRemoteDatabaseUrl,
	migrationsTable,
} from '../../../utils.js';
import { getMigrationQueries } from '../../queries.js';
const { diff } = deepDiff;
const sqliteDialect = new SQLiteAsyncDialect();

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
		// eslint-disable-next-line no-console
		console.error(appTokenError);
		process.exit(1);
	}

	const db = createRemoteDatabaseClient(appToken);
	// Temporary: create the migration table just in case it doesn't exist
	await db.run(
		sql`CREATE TABLE IF NOT EXISTS ReservedAstroStudioMigrations ( name TEXT PRIMARY KEY )`
	);
	// get all migrations from the DB
	const allRemoteMigrations = await db.select().from(migrationsTable);
	// get all migrations from the filesystem
	const allLocalMigrations = await getMigrations();
	// filter to find all migrations that are in FS but not DB
	const missingMigrations = allLocalMigrations.filter((migration) => {
		return !allRemoteMigrations.find((m) => m.name === migration);
	});

	if (missingMigrations.length === 0) {
		console.info('No migrations to push! Your database is up to date!');
	} else {
		console.log(`Pushing ${missingMigrations.length} migrations...`);
		await pushSchema({ migrations: missingMigrations, appToken, isDryRun, db, currentSnapshot });
	}
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
	db,
	currentSnapshot,
}: {
	migrations: string[];
	appToken: string;
	isDryRun: boolean;
	db: ReturnType<typeof createRemoteDatabaseClient>;
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
	const missingMigrationBatch = missingMigrationContents.reduce((acc, curr) => {
		return [...acc, ...curr.db];
	}, initialMigrationBatch);
	// apply the batch to the DB
	const queries: SQL[] = missingMigrationBatch.map((q) => sql.raw(q));
	await runBatchQuery({ queries, appToken, isDryRun });
	// Update the migrations table to add all the newly run migrations
	await db.insert(migrationsTable).values(migrations.map((m) => ({ name: m })));
	// update the config schema in the admin table
	await db
		.update(adminTable)
		.set({ collections: JSON.stringify(currentSnapshot) })
		.where(eq(adminTable.id, STUDIO_ADMIN_TABLE_ROW_ID));
}

/** TODO: refine with migration changes */
async function pushData({
	config,
	appToken,
	isDryRun,
}: {
	config: AstroConfig;
	appToken: string;
	isDryRun?: boolean;
}) {
	const db = await createLocalDatabaseClient({
		collections: config.db!.collections! as DBCollections,
		dbUrl: ':memory:',
		seeding: true,
	});
	const queries: Query[] = [];

	// TODO: update migration seeding
	// for (const [name, collection] of Object.entries(config.db!.collections! as DBCollections)) {
	// 	if (collection.writable || !collection.data) continue;
	// 	const table = collectionToTable(name, collection);
	// 	const insert = db.insert(table).values(await collection.data());
	// 	queries.push(insert.toSQL());
	// }
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
