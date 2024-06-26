import { fileURLToPath } from 'url';
import type { Loader } from './loaders.js';
import { promises as fs, existsSync } from 'fs';

/**
 * Loads entries from a JSON file. The file must contain an array of objects that contain unique `id` fields, or an object with string keys.
 * @todo Add support for other file types, such as YAML, CSV etc.
 * @param fileName The path to the JSON file to load, relative to the content directory.
 */
export function file(fileName: string): Loader {
	if (fileName.includes('*')) {
		throw new Error('Glob patterns are not supported in file loader. Use `glob` loader instead.');
	}
	return {
		name: 'file-loader',
		load: async ({ store, logger, settings, parseData }) => {
			const contentDir = new URL('./content/', settings.config.srcDir);

			const url = new URL(fileName, contentDir);
			if (!existsSync(url)) {
				logger.error(`File not found: ${fileName}`);
				return;
			}

			const data = await fs.readFile(url, 'utf-8');
			const json = JSON.parse(data);

			const filePath = fileURLToPath(url);

			if (Array.isArray(json)) {
				if (json.length === 0) {
					logger.warn(`No items found in ${fileName}`);
				}
				for (const rawItem of json) {
					const id = rawItem.id ?? rawItem.slug;
					const item = await parseData({ id, data: rawItem, filePath });
					store.set(id, item);
				}
			} else if (typeof json === 'object') {
				for (const [id, rawItem] of Object.entries<Record<string, unknown>>(json)) {
					const item = await parseData({ id, data: rawItem, filePath });
					store.set(id, item);
				}
			} else {
				logger.error(`Invalid data in ${fileName}. Must be an array or object.`);
			}

			logger.info('Loading posts');
		},
	};
}
