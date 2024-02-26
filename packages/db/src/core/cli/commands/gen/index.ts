import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import { writeFile } from 'node:fs/promises';
import {
	MIGRATIONS_CREATED,
	MIGRATIONS_UP_TO_DATE,
	getMigrationStatus,
	initializeMigrationsDirectory,
} from '../../migrations.js';
import { getMigrationQueries } from '../../migration-queries.js';
import { bgRed, red, reset } from 'kleur/colors';

export async function cmd({ config }: { config: AstroConfig; flags: Arguments }) {
	const migration = await getMigrationStatus(config);

	if (migration.state === 'no-migrations-found') {
		await initializeMigrationsDirectory(migration.currentSnapshot);
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
	const migrationFileContent = {
		diff,
		db: migrationQueries,
		// TODO(fks): Encode the relevant data, instead of the raw message.
		// This will give `db push` more control over the formatting of the message.
		confirm: confirmations.map((c) => reset(c)),
	};
	const migrationFileName = `./migrations/${newFilename}`;
	await writeFile(migrationFileName, JSON.stringify(migrationFileContent, undefined, 2));
	console.log(migrationFileName + ' created!');
}
