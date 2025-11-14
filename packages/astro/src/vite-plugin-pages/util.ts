import { extname } from 'node:path';

// This is an arbitrary string that we use to replace the dot of the extension.
const ASTRO_PAGE_EXTENSION_POST_PATTERN = '@_@';

/**
 * Prevents Rollup from triggering other plugins in the process by masking the extension (hence the virtual file).
 * Inverse function of getComponentFromVirtualModulePageName() below.
 * @param virtualModulePrefix The prefix used to create the virtual module
 * @param path Page component path
 */
export function getVirtualModulePageName(virtualModulePrefix: string, path: string): string {
	const extension = extname(path);
	return (
		virtualModulePrefix +
		(extension.startsWith('.')
			? path.slice(0, -extension.length) + extension.replace('.', ASTRO_PAGE_EXTENSION_POST_PATTERN)
			: path)
	);
}
