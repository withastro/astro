import type { AstroSettings } from '../../@types/astro';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../constants.js';
import type { ModuleLoader } from '../module-loader';

/**
 * It accepts a module loader and the astro settings, and it attempts to load the middlewares defined in the configuration.
 *
 * If not middlewares were not set, the function returns an empty array.
 */
export async function loadMiddleware(
	moduleLoader: ModuleLoader,
	srcDir: AstroSettings['config']['srcDir']
) {
	// can't use node Node.js builtins
	let middlewarePath = srcDir.pathname + '/' + MIDDLEWARE_PATH_SEGMENT_NAME;
	try {
		const module = await moduleLoader.import(middlewarePath);
		return module;
	} catch {
		return void 0;
	}
}
