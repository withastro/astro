import type { InArgs, InStatement } from '@libsql/client';
import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { eq, sql, type Query } from 'drizzle-orm';
import type { Arguments } from 'yargs-parser';
import { appTokenError } from '../../../errors.js';
import { collectionToTable, createLocalDatabaseClient } from '../../../internal.js';
import { getMigrations, initializeFromMigrations, loadMigration } from '../../../migrations.js';
import type { DBCollections } from '../../../types.js';
import {
	STUDIO_ADMIN_TABLE_ROW_ID,
	adminTable,
	createRemoteDatabaseClient,
	getAstroStudioEnv,
	getRemoteDatabaseUrl,
} from '../../../utils.js';
const { diff } = deepDiff;

export async function cmd({ config, flags }: { config: AstroConfig; flags: Arguments }) {
	const isSeedData = flags.seed;
	const isDryRun = flags.dryRun;

	const currentSnapshot = JSON.parse(JSON.stringify(config.db?.collections ?? {}));
	const allMigrationFiles = await getMigrations();
	if (allMigrationFiles.length === 0) {
		console.log('Project not yet initialized!');
		process.exit(1);
	}

	const prevSnapshot = await initializeFromMigrations(allMigrationFiles);
	const calculatedDiff = diff(prevSnapshot, currentSnapshot);
	if (calculatedDiff) {
		console.log('Changes detected!');
		process.exit(1);
	}

	const appToken = getAstroStudioEnv().ASTRO_STUDIO_APP_TOKEN;
	if (!appToken) {
		// eslint-disable-next-line no-console
		console.error(appTokenError);
		process.exit(1);
	}

	const db = createRemoteDatabaseClient(appToken);

	// get all migrations from the DB
	const allRemoteMigrations = (await db.run(sql`SELECT * FROM _migrations`)) as any[];
	// get all migrations from the filesystem
	const allLocalMigrations = await getMigrations();
	// filter to find all migrations that are in FS but not DB
	const missingMigrations = allLocalMigrations.filter((migration) => {
		return !allRemoteMigrations.find((m: any) => m.name === migration);
	});

	console.log(`Pushing ${missingMigrations.length} migrations...`);

	// load all missing migrations
	const missingMigrationContents = await Promise.all(missingMigrations.map(loadMigration));
	// combine all missing migrations into a single batch
	const missingMigrationBatch = missingMigrationContents.reduce((acc, curr) => {
		return [...acc, ...curr.db];
	}, [] as string[]);
	// apply the batch to the DB
	// TODO: How to do this with Drizzle ORM & proxy implementation? Unclear.
	// @ts-expect-error
	await db.batch(missingMigrationBatch);

	// TODO: Update the migrations table to set all to "applied"

	// update the config schema in the admin table
	db.update(adminTable)
		.set({ collections: JSON.stringify(currentSnapshot) })
		.where(eq(adminTable.id, STUDIO_ADMIN_TABLE_ROW_ID));

	if (isSeedData) {
		console.info('Pushing data...');
		await tempDataPush({ currentSnapshot, appToken, isDryRun });
	}
	console.info('Push complete!');
}

/** TODO: refine with migration changes */
async function tempDataPush({
	currentSnapshot,
	appToken,
	isDryRun,
}: {
	currentSnapshot: DBCollections;
	appToken: string;
	isDryRun?: boolean;
}) {
	const db = await createLocalDatabaseClient({
		collections: currentSnapshot,
		dbUrl: ':memory:',
		seeding: true,
	});
	const queries: Query[] = [];

	for (const [name, collection] of Object.entries(currentSnapshot)) {
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
