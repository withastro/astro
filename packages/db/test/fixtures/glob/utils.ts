import { type DBDataContext, type ResolvedCollectionConfig } from '@astrojs/db';
import chokidar from 'chokidar';
import { eq } from 'drizzle-orm';
import fastGlob from 'fast-glob';
import { readFile } from 'fs/promises';

export function createGlob({ db, mode }: Pick<DBDataContext, 'db' | 'mode'>) {
	return async function glob(
		pattern: string,
		opts: {
			into: ResolvedCollectionConfig;
			parse: (params: { file: string; content: string }) => Record<string, any>;
		}
	) {
		// TODO: expose `table`
		const { table } = opts.into as any;
		const fileColumn = table.file;
		if (!fileColumn) {
			throw new Error('`file` column is required for glob tables.');
		}
		if (mode === 'dev') {
			chokidar
				.watch(pattern)
				.on('add', async (file) => {
					const content = await readFile(file, 'utf-8');
					const parsed = opts.parse({ file, content });
					await db.insert(table).values({ ...parsed, file });
				})
				.on('change', async (file) => {
					const content = await readFile(file, 'utf-8');
					const parsed = opts.parse({ file, content });
					await db
						.insert(table)
						.values({ ...parsed, file })
						.onConflictDoUpdate({
							target: fileColumn,
							set: parsed,
						});
				})
				.on('unlink', async (file) => {
					await db.delete(table).where(eq(fileColumn, file));
				});
		} else {
			const files = await fastGlob(pattern);
			for (const file of files) {
				const content = await readFile(file, 'utf-8');
				const parsed = opts.parse({ file, content });
				await db.insert(table).values({ ...parsed, file });
			}
		}
	};
}

export function asJson(params: { file: string; content: string }) {
	try {
		return JSON.parse(params.content);
	} catch (e) {
		throw new Error(`Error parsing ${params.file}: ${e.message}`);
	}
}
