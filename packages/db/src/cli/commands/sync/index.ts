import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { writeFile } from 'fs/promises';
import type { Arguments } from 'yargs-parser';
import {
	getMigrations,
	initializeFromMigrations,
	initializeMigrationsDirectory,
} from '../../../migrations.js';
import { getMigrationQueries } from '../../queries.js';
const { diff } = deepDiff;

export async function cmd({ config }: { config: AstroConfig; flags: Arguments }) {
	const currentSnapshot = JSON.parse(JSON.stringify(config.db?.collections ?? {}));
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

	const migrationQueries = await getMigrationQueries({
		oldCollections: prevSnapshot,
		newCollections: currentSnapshot,
	});

	const largestNumber = allMigrationFiles.reduce((acc, curr) => {
		const num = parseInt(curr.split('_')[0]);
		return num > acc ? num : acc;
	}, 0);
	const migrationFileContent = {
		diff: calculatedDiff,
		db: migrationQueries,
	};
	const migrationFileName = `./migrations/${String(largestNumber + 1).padStart(
		4,
		'0'
	)}_migration.json`;
	await writeFile(migrationFileName, JSON.stringify(migrationFileContent, undefined, 2));
	console.log(migrationFileName + ' created!');
}
