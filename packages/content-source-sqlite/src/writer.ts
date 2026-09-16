import * as devalue from 'devalue';
import type {
	ContentCollectionData,
	ContentCollectionStorageWriter,
	ContentCollectionStorageWriterFactory,
} from 'astro/content/storage';
import type { InStatement } from '@libsql/client';
import { createDatabaseClient } from './client.js';
import { type ContentStorageConfig, parseConfig } from './types.js';

export function createContentWriter(config: ContentStorageConfig): ContentCollectionStorageWriter {
	const client = createDatabaseClient(config);
	return {
		async write(collections: ContentCollectionData) {
			const statements: InStatement[] = [
				`CREATE TABLE IF NOT EXISTS astro_content_collections (
					name TEXT PRIMARY KEY
				) WITHOUT ROWID`,
				`CREATE TABLE IF NOT EXISTS astro_content_entries (
					collection TEXT NOT NULL,
					id TEXT NOT NULL,
					position INTEGER NOT NULL,
					payload TEXT NOT NULL,
					PRIMARY KEY (collection, id),
					FOREIGN KEY (collection) REFERENCES astro_content_collections(name) ON DELETE CASCADE
				) WITHOUT ROWID`,
				'DELETE FROM astro_content_entries',
				'DELETE FROM astro_content_collections',
			];

			for (const [collection, entries] of [...collections].sort(([a], [b]) => a.localeCompare(b))) {
				statements.push({
					sql: 'INSERT INTO astro_content_collections (name) VALUES (?)',
					args: [collection],
				});
				let position = 0;
				for (const [id, entry] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
					statements.push({
						sql: 'INSERT INTO astro_content_entries (collection, id, position, payload) VALUES (?, ?, ?, ?)',
						args: [collection, id, position++, devalue.stringify(entry)],
					});
				}
			}

			await client.batch(statements, 'write');
		},
	};
}

const createWriter: ContentCollectionStorageWriterFactory = (config) =>
	createContentWriter(parseConfig(config));

export default createWriter;
