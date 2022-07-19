import npath from 'path';
import vite from 'vite';
import { unwrapId } from '../../util.js';

/**
 * List of file extensions signalling we can (and should) SSR ahead-of-time
 * See usage below
 */
const fileExtensionsToSSR = new Set(['.astro', '.md']);

/** recursively crawl the module graph to get all style files imported by parent id */
export async function* crawlGraph(
	viteServer: vite.ViteDevServer,
	_id: string,
	isFile: boolean,
	scanned = new Set<string>()
): AsyncGenerator<vite.ModuleNode, void, unknown> {
	const id = unwrapId(_id);
	const importedModules = new Set<vite.ModuleNode>();
	const moduleEntriesForId = isFile
		? // If isFile = true, then you are at the root of your module import tree.
		  // The `id` arg is a filepath, so use `getModulesByFile()` to collect all
		  // nodes for that file. This is needed for advanced imports like Tailwind.
		  viteServer.moduleGraph.getModulesByFile(id) ?? new Set()
		: // Otherwise, you are following an import in the module import tree.
		  // You are safe to use getModuleById() here because Vite has already
		  // resolved the correct `id` for you, by creating the import you followed here.
		  new Set([viteServer.moduleGraph.getModuleById(id)]);

	// Collect all imported modules for the module(s).
	for (const entry of moduleEntriesForId) {
		// Handle this in case an module entries weren't found for ID
		// This seems possible with some virtual IDs (ex: `astro:markdown/*.md`)
		if (!entry) {
			continue;
		}
		if (id === entry.id) {
			scanned.add(id);
			for (const importedModule of entry.importedModules) {
				// some dynamically imported modules are *not* server rendered in time
				// to only SSR modules that we can safely transform, we check against
				// a list of file extensions based on our built-in vite plugins
				if (importedModule.id) {
					// use URL to strip special query params like "?content"
					const { pathname } = new URL(`file://${importedModule.id}`);
					if (fileExtensionsToSSR.has(npath.extname(pathname))) {
						const mod = viteServer.moduleGraph.getModuleById(importedModule.id);
						if (!mod?.ssrModule) {
							await viteServer.ssrLoadModule(importedModule.id);
						}
					}
				}
				importedModules.add(importedModule);
			}
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
