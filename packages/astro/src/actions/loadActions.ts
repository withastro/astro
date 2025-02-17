import type { ModuleLoader } from '../core/module-loader/index.js';
import { ASTRO_ACTIONS_INTERNAL_MODULE_ID } from './consts.js';
import type { SSRAstroActions } from '../core/app/types.js';

/**
 * It accepts a module loader and the astro settings, and it attempts to load the middlewares defined in the configuration.
 *
 * If not middlewares were not set, the function returns an empty array.
 */
export async function loadActions(moduleLoader: ModuleLoader) {
	try {
		return (await moduleLoader.import(ASTRO_ACTIONS_INTERNAL_MODULE_ID)) as SSRAstroActions;
	} catch (error: any) {
		// TODO create astro error
		// const astroError = new AstroError(MiddlewareCantBeLoaded, { cause: error });
		throw error;
	}
}
