import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { getVirtualModulePageName } from '../vite-plugin-pages/util.js';
import { MODULE_DEV_CSS_PREFIX, RESOLVED_MODULE_DEV_CSS_PREFIX } from './const.js';

/**
 * Get the virtual module name for a dev CSS import.
 * Usage: `await loader.import(getDevCSSModuleName(routeData.component))`
 */
export function getDevCSSModuleName(componentPath: string): string {
	return getVirtualModulePageName(MODULE_DEV_CSS_PREFIX, componentPath);
}

/** Get the virtual module name for a dev CSS import from the name of a virtual module for a page. */
export function getDevCssModuleNameFromPageVirtualModuleName(
	virtualModulePageName: string,
): string {
	return virtualModulePageName.replace(
		VIRTUAL_PAGE_RESOLVED_MODULE_ID,
		RESOLVED_MODULE_DEV_CSS_PREFIX,
	);
}
