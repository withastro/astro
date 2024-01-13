import type { AstroConfig } from 'astro';
import { diffJson } from 'diff';
import { eq } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';
import yargs from 'yargs-parser';
import { getMigrationQueries } from '../../queries.js';
import { STUDIO_ADMIN_TABLE_ROW_ID, adminTable, createRemoteDbClient } from '../../../utils.js';

export async function cmd({}: { config: Pick<AstroConfig, 'db'> }) {
	const args = yargs(process.argv.slice(3)) as unknown as {
		from: string;
		to: string;
		format: 'diff' | 'modify' | 'migrate';
	};
	const fromSnapshot = JSON.parse(await fs.readFile(path.resolve(args.from), 'utf-8'));
	const toSnapshot = JSON.parse(await fs.readFile(path.resolve(args.to), 'utf-8'));

	if (args.format === 'diff') {
		const diffResult = diffJson(fromSnapshot, toSnapshot);
		// eslint-disable-next-line no-console
		console.log(
			diffResult
				.map((part) => {
					if (part.added) {
						return '+ ' + part.value + '';
					}
					if (part.removed) {
						return '- ' + part.value + '';
					}
					return part.value;
				})
				.join('')
				.split('\n')
				.map((line) => {
					if (line.startsWith('+')) {
						return '\x1b[32m' + line + '\x1b[0m';
					} else if (line.startsWith('-')) {
						return '\x1b[31m' + line + '\x1b[0m';
					}
					return '  ' + line;
				})
				.join('\n')
		);
		return;
	}
	const migrationQueries = await getMigrationQueries({
		oldCollections: fromSnapshot,
		newCollections: toSnapshot,
	});

	// DUMMY DB CLIENT! Just need this to generate the SQL
	const db = createRemoteDbClient('');
	const updateCollectionsJson = db
		.update(adminTable)
		.set({ collections: JSON.stringify(toSnapshot) })
		.where(eq(adminTable.id, STUDIO_ADMIN_TABLE_ROW_ID))
		.getSQL().toString();
	migrationQueries.push(updateCollectionsJson);

	if (args.format === 'modify') {
		// eslint-disable-next-line no-console
		console.log(migrationQueries);
		return;
	}
	if (args.format === 'migrate') {
		// eslint-disable-next-line no-console
		console.log(
			[
				`export async function run(db) {`,
				`  await db.batch([`,
				...migrationQueries.map((query) => `    db.query(\`${query}\`);`),
				`  ]);`,
				`}`,
			].join('\n')
		);
		return;
	}
	// eslint-disable-next-line no-console
	console.error('Invalid format: ' + args.format);
	process.exit(1);
}
