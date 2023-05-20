// TODO: remove after the experimetal phase when

import type { AstroConfig } from '../@types/astro';
import type { ModuleInfo, ModuleLoader } from '../core/module-loader';
import { viteID } from '../core/util.js';

export function isHybridMalconfigured(config: AstroConfig) {
	return config.experimental.hybridOutput ? config.output !== 'hybrid' : config.output === 'hybrid';
}

export function isHybridOutput(config: AstroConfig) {
	return config.experimental.hybridOutput && config.output === 'hybrid';
}

export function getPrerenderMetadata(moduleInfo: ModuleInfo) {
	return moduleInfo?.meta?.astro?.pageOptions?.prerender === true;
}

type GetPrerenderStatusParams = {
	filePath: URL;
	loader: ModuleLoader;
};

export function getPrerenderStatus({
	filePath,
	loader,
}: GetPrerenderStatusParams): boolean | undefined {
	const fileID = viteID(filePath);
	console.log({ fileID });
	const moduleInfo = loader.getModuleInfo(fileID);
	if (!moduleInfo) return;
	const prerenderStatus = getPrerenderMetadata(moduleInfo);
	console.log({ prerenderStatus });
	return prerenderStatus;
}
