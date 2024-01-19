import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { eq, sql } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import type { Arguments } from 'yargs-parser';
import { appTokenError } from '../../../errors.js';
import {
	getMigrations,
	initializeFromMigrations,
} from '../../../migrations.js';
import {
	STUDIO_ADMIN_TABLE_ROW_ID,
	adminTable,
	createRemoteDatabaseClient,
	getAstroStudioEnv
} from '../../../utils.js';
const { diff } = deepDiff;



export async function cmd({ config }: { config: AstroConfig, flags: Arguments }) {
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
	// load all missing migrations
	const missingMigrationContents = await Promise.all(
		missingMigrations.map(async (migration) => {
			return JSON.parse(await readFile(`./migrations/${migration}`, 'utf-8'));
		})
	);
	// combine all missing migrations into a single batch
	const missingMigrationBatch = missingMigrationContents.reduce((acc, curr) => {
		return [...acc, ...curr.diff];
	});
	// apply the batch to the DB
	// TODO: How to do this with Drizzle ORM & proxy implementation? Unclear.
	// @ts-expect-error
	await db.batch(missingMigrationBatch);
	// update the config schema in the admin table
	db.update(adminTable)
		.set({ collections: JSON.stringify(currentSnapshot) })
		.where(eq(adminTable.id, STUDIO_ADMIN_TABLE_ROW_ID));
}

