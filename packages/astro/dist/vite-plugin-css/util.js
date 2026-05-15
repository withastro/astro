import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../vite-plugin-pages/const.js';
import { getVirtualModulePageName } from '../vite-plugin-pages/util.js';
import { MODULE_DEV_CSS_PREFIX, RESOLVED_MODULE_DEV_CSS_PREFIX } from './const.js';
function getDevCSSModuleName(componentPath) {
	return getVirtualModulePageName(MODULE_DEV_CSS_PREFIX, componentPath);
}
function getDevCssModuleNameFromPageVirtualModuleName(virtualModulePageName) {
	return virtualModulePageName.replace(
		VIRTUAL_PAGE_RESOLVED_MODULE_ID,
		RESOLVED_MODULE_DEV_CSS_PREFIX,
	);
}
export { getDevCSSModuleName, getDevCssModuleNameFromPageVirtualModuleName };
