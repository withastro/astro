import deepDiff from 'deep-diff';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { tablesSchema, type DBSnapshot } from '../types.js';
import type { AstroConfig } from 'astro';
import { cyan, green, yellow } from 'kleur/colors';
const { applyChange, diff: generateDiff } = deepDiff;

export type MigrationStatus =
	| {
			state: 'no-migrations-found';
			currentSnapshot: DBSnapshot;
	  }
	| {
			state: 'ahead';
			oldSnapshot: DBSnapshot;
			newSnapshot: DBSnapshot;
			diff: deepDiff.Diff<DBSnapshot, DBSnapshot>[];
			newFilename: string;
			summary: string;
			newFileContent?: string;
	  }
	| {
			state: 'up-to-date';
			currentSnapshot: DBSnapshot;
	  };

export async function getMigrationStatus(config: AstroConfig): Promise<MigrationStatus> {
	const currentSnapshot = createCurrentSnapshot(config);
	const allMigrationFiles = await getMigrations();

	if (allMigrationFiles.length === 0) {
		return {
			state: 'no-migrations-found',
			currentSnapshot,
		};
	}

	const previousSnapshot = await initializeFromMigrations(allMigrationFiles);
	const diff = generateDiff(previousSnapshot, currentSnapshot);

	if (diff) {
		const n = getNewMigrationNumber(allMigrationFiles);
		const newFilename = `${String(n + 1).padStart(4, '0')}_migration.json`;
		return {
			state: 'ahead',
			oldSnapshot: previousSnapshot,
			newSnapshot: currentSnapshot,
			diff,
			newFilename,
			summary: generateDiffSummary(diff),
		};
	}

	return {
		state: 'up-to-date',
		currentSnapshot,
	};
}

export const MIGRATIONS_CREATED = `${green(
	'■ Migrations initialized!'
)}\n\n  To execute your migrations, run\n  ${cyan('astro db push')}`;
export const MIGRATIONS_UP_TO_DATE = `${green(
	'■ No migrations needed!'
)}\n\n  Your database is up to date.\n`;
export const MIGRATIONS_NOT_INITIALIZED = `${yellow(
	'▶ No migrations found!'
)}\n\n  To scaffold your migrations folder, run\n  ${cyan('astro db sync')}\n`;
export const MIGRATION_NEEDED = `${yellow(
	'▶ Changes detected!'
)}\n\n  To create the necessary migration file, run\n  ${cyan('astro db sync')}\n`;

function generateDiffSummary(diff: deepDiff.Diff<DBSnapshot, DBSnapshot>[]) {
	// TODO: human readable summary
	return JSON.stringify(diff, null, 2);
}

function getNewMigrationNumber(allMigrationFiles: string[]): number {
	const len = allMigrationFiles.length - 1;
	return allMigrationFiles.reduce((acc, curr) => {
		const num = Number.parseInt(curr.split('_')[0] ?? len, 10);
		return num > acc ? num : acc;
	}, 0);
}

export async function getMigrations(): Promise<string[]> {
	const migrationFiles = await readdir('./migrations').catch((err) => {
		if (err.code === 'ENOENT') {
			return [];
		}
		throw err;
	});
	return migrationFiles;
}

export async function loadMigration(
	migration: string
): Promise<{ diff: any[]; db: string[]; confirm?: string[] }> {
	return JSON.parse(await readFile(`./migrations/${migration}`, 'utf-8'));
}

export async function loadInitialSnapshot(): Promise<DBSnapshot> {
	const snapshot = JSON.parse(await readFile('./migrations/0000_snapshot.json', 'utf-8'));
	// `experimentalVersion: 1` -- added the version column
	if (snapshot.experimentalVersion === 1) {
		return snapshot;
	}
	// `experimentalVersion: 0` -- initial format
	if (!snapshot.schema) {
		return { experimentalVersion: 1, schema: snapshot };
	}
	throw new Error('Invalid snapshot format');
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
	// Parse to resolve non-serializable types like () => references
	const tablesConfig = tablesSchema.parse(config.db?.tables ?? {});
	const schema = JSON.parse(JSON.stringify(tablesConfig));
	return { experimentalVersion: 1, schema };
}
export function createEmptySnapshot(): DBSnapshot {
	return { experimentalVersion: 1, schema: {} };
}
