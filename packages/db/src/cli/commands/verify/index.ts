import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import type { Arguments } from 'yargs-parser';
import { getMigrations, initializeFromMigrations } from '../../../migrations.js';
const { diff } = deepDiff;

export async function cmd({ config }: { config: AstroConfig; flags: Arguments }) {
	const core = await isGithubActions();
	const currentSnapshot = JSON.parse(JSON.stringify(config.db?.collections ?? {}));
	const allMigrationFiles = await getMigrations();
	if (allMigrationFiles.length === 0) {
		if (core) {
			core.setFailed(`Project not yet initialized!`);
		}
		console.log('Project not yet initialized!');
		process.exit(1);
	}

	const prevSnapshot = await initializeFromMigrations(allMigrationFiles);
	const calculatedDiff = diff(prevSnapshot, currentSnapshot);
	if (calculatedDiff) {
		if (core) {
			  core.setFailed(`Schema changes detected!`);
			  process.exit(1);
		}
		console.log('Changes detected!');
		process.exit(1);
	}
	if (core) {
		  core.info('No changes detected!');
	}
	console.log('No changes detected.');
	return;
}


async function isGithubActions(): Promise<typeof import('@actions/core') | undefined> {
	if (process.env['GITHUB_ACTIONS'] === 'true') {
		return import('@actions/core').then(res => res.default)
	}

	return undefined;
}
