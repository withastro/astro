import { extname } from 'node:path';
import type { BuildOptions, Rollup, Plugin as VitePlugin } from 'vite';

// eslint-disable-next-line @typescript-eslint/ban-types
type OutputOptionsHook = Extract<VitePlugin['outputOptions'], Function>;
type OutputOptions = Parameters<OutputOptionsHook>[0];

type ExtendManualChunksHooks = {
	before?: Rollup.GetManualChunk;
	after?: Rollup.GetManualChunk;
};

export function extendManualChunks(outputOptions: OutputOptions, hooks: ExtendManualChunksHooks) {
	const manualChunks = outputOptions.manualChunks;
	outputOptions.manualChunks = function (id, meta) {
		if (hooks.before) {
			let value = hooks.before(id, meta);
			if (value) {
				return value;
			}
		}

		// Defer to user-provided `manualChunks`, if it was provided.
		if (typeof manualChunks == 'object') {
			if (id in manualChunks) {
				let value = manualChunks[id];
				return value[0];
			}
		} else if (typeof manualChunks === 'function') {
			const outid = manualChunks.call(this, id, meta);
			if (outid) {
				return outid;
			}
		}

		if (hooks.after) {
			return hooks.after(id, meta) || null;
		}
		return null;
	};
}

// This is an arbitrary string that we use to replace the dot of the extension.
export const ASTRO_PAGE_EXTENSION_POST_PATTERN = '@_@';
// This is an arbitrary string that we use to make a pageData key
// Has to be a invalid character for a route, to avoid conflicts.
export const ASTRO_PAGE_KEY_SEPARATOR = '&';

/**
 * Generate a unique key to identify each page in the build process.
 * @param route Usually pageData.route.route
 * @param componentPath Usually pageData.component
 */
export function makePageDataKey(route: string, componentPath: string) {
	return route + ASTRO_PAGE_KEY_SEPARATOR + componentPath;
}

/**
 * Prevents Rollup from triggering other plugins in the process by masking the extension (hence the virtual file).
 *
 * @param virtualModulePrefix The prefix used to create the virtual module
 * @param path Page component path
 * @param route Route of the page
 */
export function getVirtualModulePageName(virtualModulePrefix: string, path: string, route: string) {
	const extension = extname(path);
	return (
		virtualModulePrefix + route + ASTRO_PAGE_KEY_SEPARATOR +
		(extension.startsWith('.')
			? path.slice(0, -extension.length) + extension.replace('.', ASTRO_PAGE_EXTENSION_POST_PATTERN)
			: path)
	);
}

/**
 * In SSR plugins, we need to use the non-resolved virtualModuleName in order to resolve correctly the virtual module.
 * @param virtualModulePrefix The prefix used to create the virtual module
 * @param resolvedModulePrefix The prefix of the resolved virtual module
 * @param resolvedId The resolved virtual module id
 * @returns 
 */
export function virtualModuleNameFromResolvedId(virtualModulePrefix: string, resolvedModulePrefix: string, resolvedId: string) {
	const extension = extname(resolvedId);
	const clean_path = resolvedId.slice(resolvedModulePrefix.length);
	return (
		virtualModulePrefix +
		(extension.startsWith('.')
			? clean_path.slice(0, -extension.length) + extension.replace('.', ASTRO_PAGE_EXTENSION_POST_PATTERN)
			: clean_path
		)
	);
}

/**
 * From the VirtualModulePageName, get the original pageData key.
 * @param virtualModulePrefix The prefix used to create the virtual module
 * @param id Virtual module name
 */
export function getPageKeyFromVirtualModulePageName(virtualModulePrefix: string, id: string) {
	const [route, path] = id
		.slice(virtualModulePrefix.length)
		.split(ASTRO_PAGE_KEY_SEPARATOR);

	const componentPath = path.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, '.');
	return makePageDataKey(route, componentPath);
}

// TODO: Should this be removed? Or refactored in generate.ts ?
export function getPathFromVirtualModulePageName(virtualModulePrefix: string, id: string) {
	const pageName = id.slice(virtualModulePrefix.length);
	return pageName.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, '.');
}

export function shouldInlineAsset(
	assetContent: string,
	assetPath: string,
	assetsInlineLimit: NonNullable<BuildOptions['assetsInlineLimit']>
) {
	if (typeof assetsInlineLimit === 'function') {
		const result = assetsInlineLimit(assetPath, Buffer.from(assetContent));
		if (result != null) {
			return result;
		} else {
			return Buffer.byteLength(assetContent) < 4096; // Fallback to 4096kb by default (same as Vite)
		}
	}
	return Buffer.byteLength(assetContent) < Number(assetsInlineLimit);
}
