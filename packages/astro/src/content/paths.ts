import type { AstroSettings } from '../types/astro.js';
import { DATA_STORE_DIR, DATA_STORE_FILE } from './consts.js';

/**
 * Get the path to the data store file.
 * During development, this is in the `.astro` directory so that the Vite watcher can see it.
 * In production, it's in the cache directory so that it's preserved between builds.
 */
export function getDataStoreFile(settings: AstroSettings, isDev: boolean) {
	return new URL(DATA_STORE_FILE, isDev ? settings.dotAstroDir : settings.config.cacheDir);
}

export function getDataStoreChunkSize(settings: AstroSettings) {
	const storage = settings.config.experimental.collectionStorage;
	// Single file doesn't have a chunk size
	if (storage === undefined || storage === 'single-file') {
		return undefined;
	}
	// Here we handle the case where users specified only 'chunked' in their config. By default, it's 20MB
	if (storage === 'chunked') {
		// Defaults to 20MB
		return 20 * 1024 * 1024;
	}
	// This is the object variant. `chunkSize` is mandatory.
	return storage.chunkSize;
}

/**
 * Get the path to the data store directory, used when the store is split across
 * multiple files.
 * During development, this is in the `.astro` directory so that the Vite watcher can see it.
 * In production, it's in the cache directory so that it's preserved between builds.
 */
export function getDataStoreDir(settings: AstroSettings, isDev: boolean) {
	return new URL(DATA_STORE_DIR, isDev ? settings.dotAstroDir : settings.config.cacheDir);
}
