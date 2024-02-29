import deepDiff from 'deep-diff';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { type DBSnapshot, type DBConfig } from '../types.js';
import { cyan, green, yellow } from 'kleur/colors';
import { getMigrationsDirUrl } from '../utils.js';
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

export const INITIAL_SNAPSHOT = '0000_snapshot.json';

export async function getMigrationStatus({
	dbConfig,
	root,
}: {
	dbConfig: DBConfig;
	root: URL;
}): Promise<MigrationStatus> {
	const currentSnapshot = createCurrentSnapshot(dbConfig);
	const dir = getMigrationsDirUrl(root);
	const allMigrationFiles = await getMigrations(dir);

	if (allMigrationFiles.length === 0) {
		return {
			state: 'no-migrations-found',
			currentSnapshot,
		};
	}

	const previousSnapshot = await initializeFromMigrations(allMigrationFiles, dir);
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

export async function getMigrations(dir: URL): Promise<string[]> {
	const migrationFiles = await readdir(dir).catch((err) => {
		if (err.code === 'ENOENT') {
			return [];
		}
		throw err;
	});
	return migrationFiles;
}

export async function loadMigration(
	migration: string,
	dir: URL
): Promise<{ diff: any[]; db: string[]; confirm?: string[] }> {
	return JSON.parse(await readFile(new URL(migration, dir), 'utf-8'));
}

export async function loadInitialSnapshot(dir: URL): Promise<DBSnapshot> {
	const snapshot = JSON.parse(await readFile(new URL(INITIAL_SNAPSHOT, dir), 'utf-8'));
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

export async function initializeMigrationsDirectory(currentSnapshot: DBSnapshot, dir: URL) {
	await mkdir(dir, { recursive: true });
	await writeFile(new URL(INITIAL_SNAPSHOT, dir), JSON.stringify(currentSnapshot, undefined, 2));
}

export async function initializeFromMigrations(
	allMigrationFiles: string[],
	dir: URL
): Promise<DBSnapshot> {
	const prevSnapshot = await loadInitialSnapshot(dir);
	for (const migration of allMigrationFiles) {
		if (migration === INITIAL_SNAPSHOT) continue;
		const migrationContent = await loadMigration(migration, dir);
		migrationContent.diff.forEach((change: any) => {
			applyChange(prevSnapshot, {}, change);
		});
	}
	return prevSnapshot;
}

export function createCurrentSnapshot({ tables = {} }: DBConfig): DBSnapshot {
	const schema = JSON.parse(JSON.stringify(tables));
	return { experimentalVersion: 1, schema };
}
export function createEmptySnapshot(): DBSnapshot {
	return { experimentalVersion: 1, schema: {} };
}
