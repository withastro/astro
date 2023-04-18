import type { ModuleLoader } from '../module-loader';
import { MIDDLEWARE_PATH_SEGMENT_NAME } from '../constants.js';
import type { AstroSettings } from '../../@types/astro';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * It accepts a module loader and the astro settings, and it attempts to load the middlewares defined in the configuration.
 *
 * If not middlewares were not set, the function returns an empty array.
 */
export async function loadMiddleware(
	moduleLoader: ModuleLoader,
	srcDir: AstroSettings['config']['srcDir']
) {
	let middlewarePath = join(fileURLToPath(srcDir), MIDDLEWARE_PATH_SEGMENT_NAME);
	try {
		const module = await moduleLoader.import(middlewarePath);
		return module;
	} catch {
		return void 0;
	}
}
