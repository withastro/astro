import { getVirtualModulePageName } from '../vite-plugin-pages/util.js';

const MODULE_DEV_CSS_PREFIX = 'virtual:astro:dev-css:';

/**
 * Get the virtual module name for a dev CSS import.
 * Usage: `await loader.import(getDevCSSModuleName(routeData.component))`
 */
export function getDevCSSModuleName(componentPath: string): string {
	return getVirtualModulePageName(MODULE_DEV_CSS_PREFIX, componentPath);
}
