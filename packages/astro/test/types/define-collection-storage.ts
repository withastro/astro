import { describe, it } from 'node:test';
import type { CollectionStorageDescriptor } from 'astro';
import { defineCollection } from 'astro/content/config';
import { glob } from 'astro/loaders';

type SqliteConfig = {
	url?: string;
};

function sqlite(config: SqliteConfig = {}): CollectionStorageDescriptor<SqliteConfig> {
	return { entrypoint: 'sqlite-driver', config };
}

describe('defineCollection({ storage })', () => {
	it('accepts a storage descriptor on collections with a loader', () => {
		defineCollection({
			loader: glob({ pattern: '**/*.md', base: './src/docs' }),
			storage: sqlite({ url: 'libsql://example.turso.io' }),
		});
	});

	it('rejects values that are not storage descriptors', () => {
		// @ts-expect-error `storage` must be a storage descriptor
		defineCollection({
			loader: glob({ pattern: '**/*.md', base: './src/docs' }),
			storage: 'external',
		});
	});
});
