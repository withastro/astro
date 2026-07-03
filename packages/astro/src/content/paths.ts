import type { AstroSettings } from '../types/astro.js';
import { DATA_STORE_FILE } from './consts.js';

/**
 * Get the path to the data store file.
 * During development, this is in the `.astro` directory so that the Vite watcher can see it.
 * In production, it's in the cache directory so that it's preserved between builds.
 */
export function getDataStoreFile(settings: AstroSettings, isDev: boolean) {
	return new URL(DATA_STORE_FILE, isDev ? settings.dotAstroDir : settings.config.cacheDir);
}
