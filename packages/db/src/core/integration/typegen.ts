import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import type { DBCollection, DBCollections } from '../types.js';
import { DB_TYPES_FILE, RUNTIME_IMPORT } from '../consts.js';

export async function typegen({ collections, root }: { collections: DBCollections; root: URL }) {
	const content = `/// <reference types="@astrojs/db" />

declare module 'astro:db' {
${Object.entries(collections)
	.map(([name, collection]) => generateTableType(name, collection))
	.join('\n')}
}
`;

	const dotAstroDir = new URL('.astro/', root);

	if (!existsSync(dotAstroDir)) {
		await mkdir(dotAstroDir);
	}

	await writeFile(new URL(DB_TYPES_FILE, dotAstroDir), content);
}

function generateTableType(name: string, collection: DBCollection): string {
	let tableType = `	export const ${name}: import(${RUNTIME_IMPORT}).Table<
		${JSON.stringify(name)},
		${JSON.stringify(
			Object.fromEntries(
				Object.entries(collection.fields).map(([fieldName, field]) => [
					fieldName,
					{
						// Only select fields Drizzle needs for inference
						type: field.type,
						optional: field.optional,
						default: field.default,
						primaryKey: 'primaryKey' in field ? field.primaryKey : false,
					},
				])
			)
		)}
	>;`;
	return tableType;
}
