import type { GetModuleInfo, ModuleInfo } from 'rollup';
interface ExtendedModuleInfo {
	info: ModuleInfo;
	depth: number;
	order: number;
}
export declare function getParentExtendedModuleInfos(
	id: string,
	ctx: {
		getModuleInfo: GetModuleInfo;
	},
	until?: (importer: string) => boolean,
	depth?: number,
	order?: number,
	childId?: string,
	seen?: Set<string>,
	accumulated?: ExtendedModuleInfo[],
): ExtendedModuleInfo[];
export declare function getParentModuleInfos(
	id: string,
	ctx: {
		getModuleInfo: GetModuleInfo;
	},
	until?: (importer: string) => boolean,
	seen?: Set<string>,
	accumulated?: ModuleInfo[],
): ModuleInfo[];
export declare function moduleIsTopLevelPage(info: ModuleInfo): boolean;
export declare function getTopLevelPageModuleInfos(
	id: string,
	ctx: {
		getModuleInfo: GetModuleInfo;
	},
): ModuleInfo[];
export {};
