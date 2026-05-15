import { fileExtension } from '@astrojs/internal-helpers/path';
import { VIRTUAL_PAGE_MODULE_ID } from './const.js';
const ASTRO_PAGE_EXTENSION_POST_PATTERN = '@_@';
function getVirtualModulePageName(virtualModulePrefix, path) {
	const extension = fileExtension(path);
	return (
		virtualModulePrefix +
		(extension.startsWith('.')
			? path.slice(0, -extension.length) + extension.replace('.', ASTRO_PAGE_EXTENSION_POST_PATTERN)
			: path)
	);
}
function getVirtualModulePageNameForComponent(component) {
	const virtualModuleName = getVirtualModulePageName(VIRTUAL_PAGE_MODULE_ID, component);
	return virtualModuleName;
}
export { getVirtualModulePageName, getVirtualModulePageNameForComponent };
