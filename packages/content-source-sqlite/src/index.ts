import type { ContentCollectionStorageConfig } from 'astro';
import { parseConfig, type ContentStorageConfig } from './types.js';

export function createContentCollectionStorage(
	config: ContentStorageConfig,
): ContentCollectionStorageConfig {
	const parsedConfig = parseConfig(config);
	return {
		reader: {
			entrypoint: new URL('./reader.js', import.meta.url),
			config: parsedConfig,
		},
		writer: {
			entrypoint: new URL('./writer.js', import.meta.url),
			config: parsedConfig,
		},
	};
}

export { createContentReader } from './reader.js';
export type { ContentStorageConfig };
export { createContentWriter } from './writer.js';
