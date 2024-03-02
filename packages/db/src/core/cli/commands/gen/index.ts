import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import type { AstroConfig } from 'astro';
import { bold, bgRed, red, reset } from 'kleur/colors';
import type { Arguments } from 'yargs-parser';
import { getMigrationQueries } from '../../migration-queries.js';
import {
	MIGRATIONS_CREATED,
	MIGRATIONS_UP_TO_DATE,
	getMigrationStatus,
	initializeMigrationsDirectory,
} from '../../migrations.js';
import { getMigrationsDirectoryUrl } from '../../../utils.js';
import type { DBConfig } from '../../../types.js';
import { relative } from 'node:path';

export async function cmd({
	astroConfig,
	dbConfig,
}: {
	astroConfig: AstroConfig;
	dbConfig: DBConfig;
	flags: Arguments;
}) {
	const migration = await getMigrationStatus({ dbConfig, root: astroConfig.root });
	const migrationsDir = getMigrationsDirectoryUrl(astroConfig.root);

	if (migration.state === 'no-migrations-found') {
		await initializeMigrationsDirectory(migration.currentSnapshot, migrationsDir);
		console.log(MIGRATIONS_CREATED);
		return;
	} else if (migration.state === 'up-to-date') {
		console.log(MIGRATIONS_UP_TO_DATE);
		return;
	}

	const { oldSnapshot, newSnapshot, newFilename, diff } = migration;
	const { queries: migrationQueries, confirmations } = await getMigrationQueries({
		oldSnapshot,
		newSnapshot,
	});
	// Warn the user about any changes that lead to data-loss.
	// When the user runs `db push`, they will be prompted to confirm these changes.
	confirmations.map((message) => console.log(bgRed(' !!! ') + ' ' + red(message)));
	const content = {
		diff,
		db: migrationQueries,
		// TODO(fks): Encode the relevant data, instead of the raw message.
		// This will give `db push` more control over the formatting of the message.
		confirm: confirmations.map((c) => reset(c)),
	};
	const fileUrl = new URL(newFilename, migrationsDir);
	const relativePath = relative(fileURLToPath(astroConfig.root), fileURLToPath(fileUrl));
	await writeFile(fileUrl, JSON.stringify(content, undefined, 2));
	console.log(bold(relativePath) + ' created!');
}
