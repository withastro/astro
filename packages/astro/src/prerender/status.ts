import type { ModuleLoader } from '../core/module-loader';
import { viteID } from '../core/util.js';
import { getPrerenderMetadata } from './utils.js';

type GetPrerenderStatusParams = {
	filePath: URL;
	loader: ModuleLoader;
};

export function getPrerenderStatus({
	filePath,
	loader,
}: GetPrerenderStatusParams): boolean | undefined {
	const fileID = viteID(filePath);
	// console.log({ fileID });
	const moduleInfo = loader.getModuleInfo(fileID);
	if (!moduleInfo) return;
	const prerenderStatus = getPrerenderMetadata(moduleInfo);
	// console.log({ prerenderStatus });
	return prerenderStatus;
}
