import type { AstroConfig } from 'astro';
import { red } from 'kleur/colors';
import prompts from 'prompts';
import type { Arguments } from 'yargs-parser';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { type DBSnapshot } from '../../../types.js';
import { getMigrationsDirUrl, getRemoteDatabaseUrl } from '../../../utils.js';
import { getMigrationQueries } from '../../migration-queries.js';
import {
	createEmptySnapshot,
	getMigrations,
	getMigrationStatus,
	INITIAL_SNAPSHOT,
	loadInitialSnapshot,
	loadMigration,
	MIGRATION_NEEDED,
	MIGRATIONS_NOT_INITIALIZED,
	MIGRATIONS_UP_TO_DATE,
} from '../../migrations.js';
import { MISSING_SESSION_ID_ERROR } from '../../../errors.js';

export async function cmd({ config, flags }: { config: AstroConfig; flags: Arguments }) {
	const isDryRun = flags.dryRun;
	const appToken = await getManagedAppTokenOrExit(flags.token);
	const migration = await getMigrationStatus(config);
	if (migration.state === 'no-migrations-found') {
		console.log(MIGRATIONS_NOT_INITIALIZED);
		process.exit(1);
	} else if (migration.state === 'ahead') {
		console.log(MIGRATION_NEEDED);
		process.exit(1);
	}
	const migrationsDir = getMigrationsDirUrl(config.root);

	// get all migrations from the filesystem
	const allLocalMigrations = await getMigrations(migrationsDir);
	let missingMigrations: string[] = [];
	try {
		const { data } = await prepareMigrateQuery({
			migrations: allLocalMigrations,
			appToken: appToken.token,
		});
		missingMigrations = data;
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.startsWith('{')) {
				const { error: { code } = { code: '' } } = JSON.parse(error.message);
				if (code === 'TOKEN_UNAUTHORIZED') {
					console.error(MISSING_SESSION_ID_ERROR);
				}
			}
		}
		console.error(error);
		process.exit(1);
	}
	// push the database schema
	if (missingMigrations.length === 0) {
		console.log(MIGRATIONS_UP_TO_DATE);
	} else {
		console.log(`Pushing ${missingMigrations.length} migrations...`);
		await pushSchema({
			migrations: missingMigrations,
			migrationsDir,
			appToken: appToken.token,
			isDryRun,
			currentSnapshot: migration.currentSnapshot,
		});
	}
	// cleanup and exit
	await appToken.destroy();
	console.info('Push complete!');
}

async function pushSchema({
	migrations,
	migrationsDir,
	appToken,
	isDryRun,
	currentSnapshot,
}: {
	migrations: string[];
	migrationsDir: URL;
	appToken: string;
	isDryRun: boolean;
	currentSnapshot: DBSnapshot;
}) {
	// load all missing migrations
	const initialSnapshot = migrations.find((m) => m === INITIAL_SNAPSHOT);
	const filteredMigrations = migrations.filter((m) => m !== INITIAL_SNAPSHOT);
	const missingMigrationContents = await Promise.all(
		filteredMigrations.map((m) => loadMigration(m, migrationsDir))
	);
	// create a migration for the initial snapshot, if needed
	const initialMigrationBatch = initialSnapshot
		? (
				await getMigrationQueries({
					oldSnapshot: createEmptySnapshot(),
					newSnapshot: await loadInitialSnapshot(migrationsDir),
				})
			).queries
		: [];

	// combine all missing migrations into a single batch
	const confirmations = missingMigrationContents.reduce((acc, curr) => {
		return [...acc, ...(curr.confirm || [])];
	}, [] as string[]);
	if (confirmations.length > 0) {
		const response = await prompts([
			...confirmations.map((message, index) => ({
				type: 'confirm' as const,
				name: String(index),
				message: red('Warning: ') + message + '\nContinue?',
				initial: true,
			})),
		]);
		if (
			Object.values(response).length === 0 ||
			Object.values(response).some((value) => value === false)
		) {
			process.exit(1);
		}
	}

	// combine all missing migrations into a single batch
	const queries = missingMigrationContents.reduce((acc, curr) => {
		return [...acc, ...curr.db];
	}, initialMigrationBatch);
	// apply the batch to the DB
	await runMigrateQuery({ queries, migrations, snapshot: currentSnapshot, appToken, isDryRun });
}

async function runMigrateQuery({
	queries: baseQueries,
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
	const queries = ['pragma defer_foreign_keys=true;', ...baseQueries];

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

	const url = new URL('/migrations/run', getRemoteDatabaseUrl());

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
	const url = new URL('/migrations/prepare', getRemoteDatabaseUrl());
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
		throw new Error(await result.text());
	}
	return await result.json();
}
