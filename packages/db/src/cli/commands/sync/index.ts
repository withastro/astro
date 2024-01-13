import type { AstroConfig } from 'astro';
import deepDiff from 'deep-diff';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { getMigrationQueries } from '../../queries.js';
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

export async function cmd({ config }: { config: Pick<AstroConfig, 'db'> }) {
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
	if (!calculatedDiff) {
		console.log('No changes detected!');
		return;
	}

	const migrationQueries = await getMigrationQueries({
		oldCollections: prevSnapshot,
		newCollections: currentSnapshot,
	});

	const largestNumber = allMigrations.reduce((acc, curr) => {
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
