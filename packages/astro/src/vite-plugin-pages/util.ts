import { fileExtension } from '@astrojs/internal-helpers/path';
import { VIRTUAL_PAGE_MODULE_ID } from './const.js';

// This is an arbitrary string that we use to replace the dot of the extension.
const ASTRO_PAGE_EXTENSION_POST_PATTERN = '@_@';

/**
 * Prevents Rollup from triggering other plugins in the process by masking the extension (hence the virtual file).
 * Inverse function of getComponentFromVirtualModulePageName() below.
 * @param virtualModulePrefix The prefix used to create the virtual module
 * @param path Page component path
 */
export function getVirtualModulePageName(virtualModulePrefix: string, path: string): string {
	const extension = fileExtension(path);
	return (
		virtualModulePrefix +
		(extension.startsWith('.')
			? path.slice(0, -extension.length) + extension.replace('.', ASTRO_PAGE_EXTENSION_POST_PATTERN)
			: path)
	);
}

export function getVirtualModulePageNameForComponent(component: string) {
	const virtualModuleName = getVirtualModulePageName(
		VIRTUAL_PAGE_MODULE_ID,
		component,
	);
	return virtualModuleName;
}
