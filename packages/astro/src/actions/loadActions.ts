import type { SSRActions } from '../core/app/types.js';
import { ActionsCantBeLoaded } from '../core/errors/errors-data.js';
import { AstroError } from '../core/errors/index.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { ENTRYPOINT_VIRTUAL_MODULE_ID } from './consts.js';

/**
 * It accepts a module loader and the astro settings, and it attempts to load the middlewares defined in the configuration.
 *
 * If not middlewares were not set, the function returns an empty array.
 */
export async function loadActions(moduleLoader: ModuleLoader) {
	try {
		return (await moduleLoader.import(ENTRYPOINT_VIRTUAL_MODULE_ID)) as SSRActions;
	} catch (error: any) {
		throw new AstroError(ActionsCantBeLoaded, { cause: error });
	}
}
