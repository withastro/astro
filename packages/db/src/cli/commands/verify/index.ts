import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import type { Arguments } from 'yargs-parser';
const { diff, applyChange } = deepDiff;

async function getMigrations() {
	const migrationFiles = await readdir('./migrations').catch((err) => {
		if (err.code === 'ENOENT') {
			return [];
		}
		throw err;
	});
	return migrationFiles;
}
async function initialize(currentSnapshot: unknown) {
	await mkdir('./migrations');
	await writeFile('./migrations/0000_snapshot.json', JSON.stringify(currentSnapshot, undefined, 2));
}

export async function cmd({ config }: { config: AstroConfig, flags: Arguments }) {
	const currentSnapshot = JSON.parse(JSON.stringify(config.db?.collections ?? {}));
	const allMigrations = await getMigrations();
	if (allMigrations.length === 0) {
		await initialize(currentSnapshot);
		console.log('Project initialized!');
		return;
	}

	const prevSnapshot = JSON.parse(await readFile('./migrations/0000_snapshot.json', 'utf-8'));
	for (const migration of allMigrations) {
		if (migration === '0000_snapshot.json') continue;
		const migrationContent = JSON.parse(await readFile(`./migrations/${migration}`, 'utf-8'));
		migrationContent.diff.forEach((change: any) => {
			applyChange(prevSnapshot, {}, change);
		});
	}

	const calculatedDiff = diff(prevSnapshot, currentSnapshot);
	if (calculatedDiff) {
		console.log('Changes detected!');
		process.exit(1);
		return;
	}

	if (calculatedDiff) {
		console.log('No changes detected!');
		return;
	}
}
