import fastGlob from 'fast-glob';
import chokidar from 'chokidar';
import { readFile } from 'fs/promises';
import { eq } from 'drizzle-orm';
import type { CollectionDataFnParams } from '@astrojs/db';

type GlobParams = {
	query: string;
	mapContent: (params: {
		path: string;
		content: string;
	}) => Record<string, unknown> & { file: string };
};

export function glob(query: string, mapContent: GlobParams['mapContent']) {
	return async ({ db, table, mode }: CollectionDataFnParams) => {
		if (mode === 'dev') {
			return devGlobCallback({ db, table, query, mapContent });
		}
		const files = await fastGlob(query);
		for (const path of files) {
			const content = await readFile(path, 'utf-8');
			await db.insert(table).values(mapContent({ path, content }));
		}
	};
}

export const asJson: GlobParams['mapContent'] = ({ content, path }) => {
	let parsed: Record<string, unknown>;
	try {
		parsed = JSON.parse(content);
	} catch (e) {
		throw new Error(`Failed to parse ${path}. Full error: ${e}`);
	}
	return { file: path, ...parsed };
};

function devGlobCallback({
	db,
	table,
	query,
	mapContent,
}: Pick<CollectionDataFnParams, 'db' | 'table'> & GlobParams) {
	chokidar
		.watch(query)
		.on('add', async (path) => {
			const content = await readFile(path, 'utf-8');
			const mapped = mapContent({ path, content });
			await db.insert(table).values(mapped);
		})
		.on('change', async (path) => {
			const content = await readFile(path, 'utf-8');
			const mapped = mapContent({ path, content });
			await db.insert(table).values(mapped).onConflictDoUpdate({
				target: table.file,
				set: mapped,
			});
		})
		.on('unlink', async (path) => {
			await db.delete(table).where(eq(table.file, path));
		});
}
