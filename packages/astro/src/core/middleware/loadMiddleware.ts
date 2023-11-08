import type { ModuleLoader } from '../module-loader/index.js';
import { MIDDLEWARE_MODULE_ID } from './vite-plugin.js';

/**
 * It accepts a module loader and the astro settings, and it attempts to load the middlewares defined in the configuration.
 *
 * If not middlewares were not set, the function returns an empty array.
 */
export async function loadMiddleware(
	moduleLoader: ModuleLoader,
) {
	try {
		const module = await moduleLoader.import(MIDDLEWARE_MODULE_ID);
		return module;
	} catch {
		return void 0;
	}
}
