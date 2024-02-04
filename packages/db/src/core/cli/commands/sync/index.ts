import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { writeFile } from 'fs/promises';
import type { Arguments } from 'yargs-parser';
import {
	createCurrentSnapshot,
	getMigrations,
	initializeFromMigrations,
	initializeMigrationsDirectory,
} from '../../migrations.js';
import { getMigrationQueries } from '../../migration-queries.js';
import prompts from 'prompts';
import { bgRed, bold, red, reset } from 'kleur/colors';
const { diff } = deepDiff;

export async function cmd({ config }: { config: AstroConfig; flags: Arguments }) {
	const currentSnapshot = createCurrentSnapshot(config);
	const allMigrationFiles = await getMigrations();
	if (allMigrationFiles.length === 0) {
		await initializeMigrationsDirectory(currentSnapshot);
		console.log('Project initialized!');
		return;
	}

	const prevSnapshot = await initializeFromMigrations(allMigrationFiles);
	const calculatedDiff = diff(prevSnapshot, currentSnapshot);
	if (!calculatedDiff) {
		console.log('No changes detected!');
		return;
	}

	const { queries: migrationQueries, confirmations } = await getMigrationQueries({
		oldSnapshot: prevSnapshot,
		newSnapshot: currentSnapshot,
	});
	// Warn the user about any changes that lead to data-loss.
	// When the user runs `db push`, they will be prompted to confirm these changes.
	confirmations.map((message) => console.log(bgRed(' !!! ') + ' ' + red(message)));
	// Generate the new migration filename by calculating the largest number.
	const largestNumber = allMigrationFiles.reduce((acc, curr) => {
		const num = parseInt(curr.split('_')[0]);
		return num > acc ? num : acc;
	}, 0);
	const migrationFileContent = {
		diff: calculatedDiff,
		db: migrationQueries,
		// TODO(fks): Encode the relevant data, instead of the raw message.
		// This will give `db push` more control over the formatting of the message.
		confirm: confirmations.map(c => reset(c)),
	};
	const migrationFileName = `./migrations/${String(largestNumber + 1).padStart(
		4,
		'0'
	)}_migration.json`;
	await writeFile(migrationFileName, JSON.stringify(migrationFileContent, undefined, 2));
	console.log(migrationFileName + ' created!');
}
