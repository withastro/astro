import type { Rolldown } from 'vite';

import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';

interface ExtendedModuleInfo {
	info: Rolldown.ModuleInfo;
	depth: number;
	order: number;
}

export interface ModuleGraphContext {
	getModuleInfo: Rolldown.GetModuleInfo;
}

// Only valid while the module graph is frozen, i.e. within a single hook invocation.
export function cachedModuleGraph(ctx: ModuleGraphContext): ModuleGraphContext {
	const cache = new Map<string, Rolldown.ModuleInfo | null>();
	return {
		getModuleInfo(id) {
			let info = cache.get(id);
			if (info === undefined) {
				info = ctx.getModuleInfo(id) ?? null;
				cache.set(id, info);
			}
			return info;
		},
	};
}

// This walks up the dependency graph and yields out each ModuleInfo object.
export function getParentExtendedModuleInfos(
	id: string,
	ctx: { getModuleInfo: Rolldown.GetModuleInfo },
	until?: (importer: string) => boolean,
	depth = 0,
	order = 0,
	childId = '',
	seen = new Set<string>(),
	accumulated: ExtendedModuleInfo[] = [],
): ExtendedModuleInfo[] {
	seen.add(id);

	const info = ctx.getModuleInfo(id);
	if (info) {
		if (childId) {
			const idx = info.importedIds.indexOf(childId);
			if (idx === -1) {
				// Dynamic imports come after all normal imports. So first add the number of normal imports.
				order += info.importedIds.length;
				// Then add on the dynamic ones.
				order += info.dynamicallyImportedIds.indexOf(childId);
			} else {
				order += idx;
			}
		}
		accumulated.push({ info, depth, order });
	}

	if (info && !until?.(id)) {
		const importers = info.importers.concat(info.dynamicImporters);
		for (const imp of importers) {
			if (!seen.has(imp)) {
				getParentExtendedModuleInfos(imp, ctx, until, depth + 1, order, id, seen, accumulated);
			}
		}
	}

	return accumulated;
}

export function getParentModuleInfos(
	id: string,
	ctx: { getModuleInfo: Rolldown.GetModuleInfo },
	until?: (importer: string) => boolean,
	seen = new Set<string>(),
	accumulated: Rolldown.ModuleInfo[] = [],
): Rolldown.ModuleInfo[] {
	seen.add(id);

	const info = ctx.getModuleInfo(id);
	if (info) {
		accumulated.push(info);
	}

	if (info && !until?.(id)) {
		const importers = info.importers.concat(info.dynamicImporters);
		for (const imp of importers) {
			if (!seen.has(imp)) {
				getParentModuleInfos(imp, ctx, until, seen, accumulated);
			}
		}
	}

	return accumulated;
}

// Returns true if a module is a top-level page. We determine this based on whether
// it is imported by the top-level virtual module.
export function moduleIsTopLevelPage(info: Rolldown.ModuleInfo): boolean {
	return (
		info.importers[0]?.includes(VIRTUAL_PAGE_RESOLVED_MODULE_ID) ||
		info.dynamicImporters[0]?.includes(VIRTUAL_PAGE_RESOLVED_MODULE_ID)
	);
}

// This function walks the dependency graph, going up until it finds a page component.
// This could be a .astro page, a .markdown or a .md (or really any file extension for markdown files) page.
export function getTopLevelPageModuleInfos(
	id: string,
	ctx: { getModuleInfo: Rolldown.GetModuleInfo },
): Rolldown.ModuleInfo[] {
	return getParentModuleInfos(id, ctx).filter(moduleIsTopLevelPage);
}
