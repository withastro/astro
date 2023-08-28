import type { ModuleInfo, ModuleLoader } from '../core/module-loader';
import { viteID } from '../core/util.js';
import type { PageOptions } from '../vite-plugin-astro/types';

type GetPrerenderStatusParams = {
	filePath: URL;
	loader: ModuleLoader;
};

export function getPrerenderStatus({
	filePath,
	loader,
}: GetPrerenderStatusParams): boolean | undefined {
	const fileID = viteID(filePath);
	const moduleInfo = loader.getModuleInfo(fileID);
	if (!moduleInfo) return;
	const pageOptions = getPageOptionsMetadata(moduleInfo);
	return pageOptions?.prerender;
}

export function getPageOptionsMetadata(moduleInfo: ModuleInfo) {
	return moduleInfo?.meta?.astro?.pageOptions as PageOptions | undefined;
}
