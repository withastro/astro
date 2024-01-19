import deepDiff from 'deep-diff';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import type { DBCollections } from './types.js';
const { applyChange } = deepDiff;

export async function getMigrations(): Promise<string[]> {
	const migrationFiles = await readdir('./migrations').catch((err) => {
		if (err.code === 'ENOENT') {
			return [];
		}
		throw err;
	});
	return migrationFiles;
}

export async function loadMigration(migration: string): Promise<{ diff: any[]; db: string[] }> {
	return JSON.parse(await readFile(`./migrations/${migration}`, 'utf-8'));
}

export async function loadInitialSnapshot(): Promise<DBCollections> {
	return JSON.parse(await readFile('./migrations/0000_snapshot.json', 'utf-8'));
}

export async function initializeMigrationsDirectory(currentSnapshot: unknown) {
	await mkdir('./migrations');
	await writeFile('./migrations/0000_snapshot.json', JSON.stringify(currentSnapshot, undefined, 2));
}

export async function initializeFromMigrations(allMigrationFiles: string[]): Promise<DBCollections> {
	const prevSnapshot = await loadInitialSnapshot();
	for (const migration of allMigrationFiles) {
		if (migration === '0000_snapshot.json') continue;
		const migrationContent = await loadMigration(migration);
		migrationContent.diff.forEach((change: any) => {
			applyChange(prevSnapshot, {}, change);
		});
	}
	return prevSnapshot;
}
