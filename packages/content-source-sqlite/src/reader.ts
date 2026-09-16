import * as devalue from 'devalue';
import type {
	ContentCollectionStorageReader,
	ContentCollectionStorageReaderFactory,
} from 'astro/content/storage';
import { createDatabaseClient } from './client.js';
import { type ContentStorageConfig, parseConfig } from './types.js';

export function createContentReader(config: ContentStorageConfig): ContentCollectionStorageReader {
	const client = createDatabaseClient(config);
	return {
		async hasCollection(collection) {
			const result = await client.execute({
				sql: 'SELECT 1 FROM astro_content_collections WHERE name = ? LIMIT 1',
				args: [collection],
			});
			return result.rows.length > 0;
		},
		async get(collection, id) {
			const result = await client.execute({
				sql: 'SELECT payload FROM astro_content_entries WHERE collection = ? AND id = ?',
				args: [collection, id],
			});
			const payload = result.rows[0]?.payload;
			return typeof payload === 'string' ? devalue.parse(payload) : undefined;
		},
		async values(collection) {
			const result = await client.execute({
				sql: 'SELECT payload FROM astro_content_entries WHERE collection = ? ORDER BY position',
				args: [collection],
			});
			return result.rows.map(({ payload }) => {
				if (typeof payload !== 'string') {
					throw new Error('Invalid content entry payload.');
				}
				return devalue.parse(payload);
			});
		},
	};
}

const createReader: ContentCollectionStorageReaderFactory = (config) =>
	createContentReader(parseConfig(config));

export default createReader;
