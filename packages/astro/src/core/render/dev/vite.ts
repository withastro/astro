import npath from 'path';
import vite from 'vite';
import { unwrapId } from '../../util.js';
import { STYLE_EXTENSIONS } from '../util.js';

const STRIP_QUERY_PARAMS_REGEX = /\?.*$/;

/**
 * List of file extensions signalling we can (and should) SSR ahead-of-time
 * See usage below
 */
const fileExtensionsToSSR = new Set(['.astro', '.md']);

/** recursively crawl the module graph to get all style files imported by parent id */
export async function* crawlGraph(
	viteServer: vite.ViteDevServer,
	_id: string,
	isRootFile: boolean,
	scanned = new Set<string>()
): AsyncGenerator<vite.ModuleNode, void, unknown> {
	const id = unwrapId(_id);
	const importedModules = new Set<vite.ModuleNode>();
	if (isRootFile) {
		// The module graph may be out-of-date when crawling
		// ex. Tailwind PostCSS process takes time
		// Use "onFileChange" to invalidate cache
		viteServer.moduleGraph.onFileChange(id);
	}
	const entry = viteServer.moduleGraph.getModuleById(id);

	if (id === entry?.id) {
		scanned.add(id);
		const entryIsStyle = STYLE_EXTENSIONS.has(npath.extname(id));
		for (const importedModule of entry.importedModules) {
			// some dynamically imported modules are *not* server rendered in time
			// to only SSR modules that we can safely transform, we check against
			// a list of file extensions based on our built-in vite plugins
			if (importedModule.id) {
				// Strip special query params like "?content".
				// NOTE: Cannot use `new URL()` here because not all IDs will be valid paths.
				// For example, `virtual:image-loader` if you don't have the plugin installed.
				const importedModulePathname = importedModule.id.replace(STRIP_QUERY_PARAMS_REGEX, '');
				// If the entry is a style, skip any modules that are not also styles.
				// Tools like Tailwind might add HMR dependencies as `importedModules`
				// but we should skip them--they aren't really imported. Without this,
				// every hoisted script in the project is added to every page!
				if (entryIsStyle && !STYLE_EXTENSIONS.has(npath.extname(importedModulePathname))) {
					continue;
				}
				if (fileExtensionsToSSR.has(npath.extname(importedModulePathname))) {
					const mod = viteServer.moduleGraph.getModuleById(importedModule.id);
					if (!mod?.ssrModule) {
						await viteServer.ssrLoadModule(importedModule.id);
					}
				}
			}
			importedModules.add(importedModule);
		}
	}

	// scan imported modules for CSS imports & add them to our collection.
	// Then, crawl that file to follow and scan all deep imports as well.
	for (const importedModule of importedModules) {
		if (!importedModule.id || scanned.has(importedModule.id)) {
			continue;
		}

		yield importedModule;
		yield* crawlGraph(viteServer, importedModule.id, false, scanned);
	}
}
