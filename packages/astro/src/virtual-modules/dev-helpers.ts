
// TODO
import type { ModuleLoader } from '../core/module-loader/loader.js';
import { getStylesForURL } from '../vite-plugin-astro-server/css.js';
import { getScriptsForURL } from '../vite-plugin-astro-server/scripts.js';
import { pathToFileURL } from 'node:url';

export function createGetPropagatedAssets(moduleLoader: ModuleLoader, basePath: string, root: URL) {
	return async function() {
		if (!moduleLoader.getModuleById(basePath)?.ssrModule) {
			await moduleLoader.import(basePath);
		}
		const { styles, urls } = await getStylesForURL(pathToFileURL(basePath), moduleLoader);
		const hoistedScripts = await getScriptsForURL(
			pathToFileURL(basePath),
			root,
			moduleLoader
		);
		const collectedLinks = [...urls];
		const collectedStyles = styles.map((s) => s.content);
		const collectedScripts = [...hoistedScripts];

		return  {
			collectedLinks,
			collectedStyles,
			collectedScripts
		};
	}
}
