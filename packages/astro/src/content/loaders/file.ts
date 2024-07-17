import { promises as fs, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import type { Loader, LoaderContext } from './types.js';

/**
 * Loads entries from a JSON file. The file must contain an array of objects that contain unique `id` fields, or an object with string keys.
 * @todo Add support for other file types, such as YAML, CSV etc.
 * @param fileName The path to the JSON file to load, relative to the content directory.
 */
export function file(fileName: string): Loader {
	if (fileName.includes('*')) {
		// TODO: AstroError
		throw new Error('Glob patterns are not supported in `file` loader. Use `glob` loader instead.');
	}

	async function syncData(filePath: string, { logger, parseData, store }: LoaderContext) {
		let json: Array<Record<string, unknown>>;

		try {
			const data = await fs.readFile(filePath, 'utf-8');
			json = JSON.parse(data);
		} catch (error: any) {
			logger.error(`Error reading data from ${fileName}`);
			logger.debug(error.message);
			return;
		}

		if (Array.isArray(json)) {
			if (json.length === 0) {
				logger.warn(`No items found in ${fileName}`);
			}
			logger.debug(`Found ${json.length} item array in ${fileName}`);
			store.clear();
			for (const rawItem of json) {
				const id = (rawItem.id ?? rawItem.slug)?.toString();
				if (!id) {
					logger.error(`Item in ${fileName} is missing an id or slug field.`);
					continue;
				}
				const data = await parseData({ id, data: rawItem, filePath });
				store.set({ id, data, filePath });
			}
		} else if (typeof json === 'object') {
			const entries = Object.entries<Record<string, unknown>>(json);
			logger.debug(`Found object with ${entries.length} entries in ${fileName}`);
			store.clear();
			for (const [id, rawItem] of entries) {
				const data = await parseData({ id, data: rawItem, filePath });
				store.set({ id, data });
			}
		} else {
			logger.error(`Invalid data in ${fileName}. Must be an array or object.`);
		}
	}

	return {
		name: 'file-loader',
		load: async (options) => {
			const { settings, logger, watcher } = options;
			logger.debug(`Loading data from ${fileName}`);
			const url = new URL(fileName, settings.config.root);
			if (!existsSync(url)) {
				logger.error(`File not found: ${fileName}`);
				return;
			}
			const filePath = fileURLToPath(url);

			await syncData(filePath, options);

			watcher?.on('change', async (changedPath) => {
				if (changedPath === filePath) {
					logger.info(`Reloading data from ${fileName}`);
					await syncData(filePath, options);
				}
			});
		},
	};
}