import fastGlob from 'fast-glob';
import chokidar from 'chokidar';
import { readFile } from 'fs/promises';
import { eq } from 'drizzle-orm';

export function glob(
	query: string,
	mapContent: (params: {
		path: string;
		content: string;
	}) => Record<string, unknown> & { id: string }
) {
	return async ({
		command,
		table,
	}: {
		table: {
			insert: any;
			update: any;
			delete: any;
		};
		command: 'dev' | 'build' | 'preview';
	}) => {
		const files = await fastGlob(query);

		for (const file of files) {
			const content = await readFile(file, 'utf-8');
			await table.insert.values(mapContent({ path: file, content }));
		}
		// Idea for tracking:
		// - add `rowid` to `table` object for querying
		// - create a `map` object that maps `path` to `rowid`
		// - on insert, use `returning()` to add a path -> rowid entry
		// - on update and delete, look up by path to find this rowid

		if (command === 'dev') {
			chokidar
				.watch(query)
				.on('add', async (path) => {
					const content = await readFile(path, 'utf-8');
					table.insert.values(mapContent({ path, content }));
				})
				.on('change', async (path) => {
					const content = await readFile(path, 'utf-8');
					const { id, ...values } = mapContent({ path, content });
					table.update.set(values).where(eq(table.id, id));
				})
				.on('remove', async (path) => {
					// TODO: we can't read the file for an id. The file is gone!
					// Guess we need a map paths -> db entry on some id.
					table.delete.where(eq(table.id, path));
				});
		}
	};
}
