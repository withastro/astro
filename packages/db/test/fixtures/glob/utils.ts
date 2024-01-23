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
	}) => Record<string, unknown> & { id: string };
};

export function glob(
	query: string,
	mapContent: (params: {
		path: string;
		content: string;
	}) => Record<string, unknown> & { id: string }
) {
	return async ({ db, table, mode }: CollectionDataFnParams) => {
		if (mode === 'dev') {
			return devGlobCallback({ db, table, query, mapContent });
		}
		const files = await fastGlob(query);
		for (const path of files) {
			const content = await readFile(path, 'utf-8');
			let mapped: Record<string, unknown>;
			try {
				mapped = mapContent({ path, content });
			} catch (e) {
				throw new Error(`Failed to parse ${path}. Full error: ${e}`);
			}
			await db.insert(table).values(mapped);
		}
	};
}

function devGlobCallback({
	db,
	table,
	query,
	mapContent,
}: Pick<CollectionDataFnParams, 'db' | 'table'> & GlobParams) {
	const rowIdByPath = new Map<string, number>();
	chokidar
		.watch(query)
		.on('add', async (path) => {
			const content = await readFile(path, 'utf-8');
			const mapped = mapContent({ path, content });
			const res = await db.insert(table).values(mapped).returning().get();
			rowIdByPath.set(path, res.rowid as number);
		})
		.on('change', async (path) => {
			const content = await readFile(path, 'utf-8');
			const mapped = mapContent({ path, content });
			const rowid = rowIdByPath.get(path);
			if (!rowid) {
				// Handle missed or failed add events
				const insert = await db.insert(table).values(mapped).returning().get();
				rowIdByPath.set(path, insert.rowid as number);
				return;
			}

			await db.update(table).set(mapped).where(eq(table.rowid, rowid));
		})
		.on('unlink', async (path) => {
			const rowid = rowIdByPath.get(path);
			if (!rowid) return;

			await db.delete(table).where(eq(table.rowid, rowid));
			rowIdByPath.delete(path);
		});
}
