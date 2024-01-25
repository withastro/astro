import deepDiff from 'deep-diff';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import type { DBSnapshot } from './types.js';
import type { AstroConfig } from 'astro';
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

export async function loadInitialSnapshot(): Promise<DBSnapshot> {
	const snapshot = JSON.parse(await readFile('./migrations/0000_snapshot.json', 'utf-8'));
	if (!snapshot.version) {
		return { version: 2, meta: {}, schema: snapshot };
	}
	return snapshot;
}

export async function initializeMigrationsDirectory(currentSnapshot: DBSnapshot) {
	await mkdir('./migrations', { recursive: true });
	await writeFile('./migrations/0000_snapshot.json', JSON.stringify(currentSnapshot, undefined, 2));
}

export async function initializeFromMigrations(allMigrationFiles: string[]): Promise<DBSnapshot> {
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

export function createCurrentSnapshot(config: AstroConfig): DBSnapshot {
	const schema = JSON.parse(JSON.stringify(config.db?.collections ?? {}));
	return { version: 2, meta: {}, schema };
}
export function createEmptySnapshot(): DBSnapshot {
	return { version: 2, meta: {}, schema: {} };
}
