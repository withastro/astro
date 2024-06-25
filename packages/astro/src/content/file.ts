import type { Loader } from './loaders.js';
import { promises as fs, existsSync } from 'fs';

export function file(fileName: string | URL): Loader {
	return {
		name: 'file-loader',
		load: async ({ store, logger, settings }) => {
			const contentDir = new URL('./content/', settings.config.srcDir);

			const url = new URL(fileName, contentDir);
			if (!existsSync(url)) {
				logger.error(`File not found: ${fileName}`);
				return;
			}

			const data = await fs.readFile(url, 'utf-8');
			const json = JSON.parse(data);

			if (Array.isArray(json)) {
				if (json.length === 0) {
					logger.warn(`No items found in ${fileName}`);
				} else {
					const firstItem = json[0];
					if (!firstItem.id && !firstItem.slug) {
						logger.error(`Invalid data in ${fileName}. Array items have an id or slug field.`);
					}
				}
				for (const item of json) {
					const id = item.id ?? item.slug;
					if (!id) {
						logger.debug(`Missing ID or slug for item: ${JSON.stringify(item)}`);
						continue;
					}
					store.set(id, item);
				}
			} else if (typeof json === 'object') {
				for (const [id, item] of Object.entries(json)) {
					store.set(id, item);
				}
			} else {
				logger.error(`Invalid data in ${fileName}. Must be an array or object.`);
			}

			logger.info('Loading posts');
		},
	};
}
