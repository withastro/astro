import fastGlob from 'fast-glob';
import { readFile } from 'fs/promises';
import chokidar from 'chokidar';
import { eq } from 'drizzle-orm';
import { type SetDataFn } from '@astrojs/db';

export function glob(
	pattern: string,
	parser: (params: { file: string; content: string }) => Record<string, any>
) {
	const setDataFn: SetDataFn = async (ctx) => {
		const fileField = ctx.table.file;
		if (!fileField) {
			throw new Error('`file` field is required for glob collections.');
		}
		if (ctx.mode === 'dev') {
			chokidar
				.watch(pattern)
				.on('add', async (file) => {
					const content = await readFile(file, 'utf-8');
					const parsed = parser({ file, content });
					await ctx.db.insert(ctx.table).values({ ...parsed, file });
				})
				.on('change', async (file) => {
					const content = await readFile(file, 'utf-8');
					const parsed = parser({ file, content });
					await ctx.db
						.insert(ctx.table)
						.values({ ...parsed, file })
						.onConflictDoUpdate({
							target: fileField,
							set: parsed,
						});
				})
				.on('unlink', async (file) => {
					await ctx.db.delete(ctx.table).where(eq(fileField, file));
				});
		} else {
			const files = await fastGlob(pattern);
			for (const file of files) {
				const content = await readFile(file, 'utf-8');
				const parsed = parser({ file, content });
				await ctx.db.insert(ctx.table).values({ ...parsed, file });
			}
		}
	};
	return setDataFn;
}

export function asJson(params: { file: string; content: string }) {
	try {
		return JSON.parse(params.content);
	} catch (e) {
		throw new Error(`Error parsing ${params.file}: ${e.message}`);
	}
}
