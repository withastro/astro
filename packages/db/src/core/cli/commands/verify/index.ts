import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import type { Arguments } from 'yargs-parser';
import { getMigrations, initializeFromMigrations } from '../../migrations.js';
const { diff } = deepDiff;

export async function cmd({ config }: { config: AstroConfig; flags: Arguments }) {
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
	console.log('No changes detected.');
	return;
}
