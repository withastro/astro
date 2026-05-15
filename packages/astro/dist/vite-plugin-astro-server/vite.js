import npath from 'node:path';
import { isCSSRequest } from 'vite';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from '../core/constants.js';
import { isPropagatedAssetBoundary } from '../core/head-propagation/boundary.js';
import { unwrapId } from '../core/util.js';
import { hasSpecialQueries } from '../vite-plugin-utils/index.js';
const fileExtensionsToSSR = /* @__PURE__ */ new Set([
	'.astro',
	'.mdoc',
	...SUPPORTED_MARKDOWN_FILE_EXTENSIONS,
]);
const STRIP_QUERY_PARAMS_REGEX = /\?.*$/;
async function* crawlGraph(environment, _id, isRootFile, scanned = /* @__PURE__ */ new Set()) {
	const id = unwrapId(_id);
	const importedModules = /* @__PURE__ */ new Set();
	const moduleEntriesForId = isRootFile
		? // "getModulesByFile" pulls from a delayed module cache (fun implementation detail),
			// So we can get up-to-date info on initial server load.
			// Needed for slower CSS preprocessing like Tailwind
			(environment.moduleGraph.getModulesByFile(id) ?? /* @__PURE__ */ new Set())
		: // For non-root files, we're safe to pull from "getModuleById" based on testing.
			// TODO: Find better invalidation strategy to use "getModuleById" in all cases!
			/* @__PURE__ */ new Set([environment.moduleGraph.getModuleById(id)]);
	for (const entry of moduleEntriesForId) {
		if (!entry) {
			continue;
		}
		if (id === entry.id) {
			scanned.add(id);
			if (isCSSRequest(id)) {
				continue;
			}
			if (hasSpecialQueries(id)) {
				continue;
			}
			for (const importedModule of entry.importedModules) {
				if (!importedModule.id) continue;
				const importedModulePathname = importedModule.id.replace(STRIP_QUERY_PARAMS_REGEX, '');
				const isFileTypeNeedingSSR = fileExtensionsToSSR.has(npath.extname(importedModulePathname));
				const isPropagationStoppingPoint = isPropagatedAssetBoundary(importedModule.id);
				if (
					isFileTypeNeedingSSR && // Should not SSR a module with ?astroPropagatedAssets
					!isPropagationStoppingPoint
				) {
					const mod = environment.moduleGraph.getModuleById(importedModule.id);
					if (!mod?.ssrModule) {
						try {
							await environment.runner.import(importedModule.id);
						} catch {}
					}
				}
				if (isImportedBy(id, importedModule) && !isPropagationStoppingPoint) {
					importedModules.add(importedModule);
				}
			}
		}
	}
	for (const importedModule of importedModules) {
		if (!importedModule.id || scanned.has(importedModule.id)) {
			continue;
		}
		yield importedModule;
		yield* crawlGraph(environment, importedModule.id, false, scanned);
	}
}
function isImportedBy(parent, entry) {
	for (const importer of entry.importers) {
		if (importer.id === parent) {
			return true;
		}
	}
	return false;
}
export { crawlGraph };
