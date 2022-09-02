import type { GetModuleInfo, ModuleInfo } from 'rollup';

import { resolvedPagesVirtualModuleId } from '../app/index.js';

// This walks up the dependency graph and yields out each ModuleInfo object.
export function* walkParentInfos(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo },
	depth = 0,
	seen = new Set<string>()
): Generator<[ModuleInfo, number], void, unknown> {
	seen.add(id);
	const info = ctx.getModuleInfo(id);
	if (info) {
		yield [info, depth];
	}
	const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
	for (const imp of importers) {
		if (seen.has(imp)) {
			continue;
		}
		yield* walkParentInfos(imp, ctx, ++depth, seen);
	}
}

// Returns true if a module is a top-level page. We determine this based on whether
// it is imported by the top-level virtual module.
export function moduleIsTopLevelPage(info: ModuleInfo): boolean {
	return info.importers[0] === resolvedPagesVirtualModuleId;
}

// This function walks the dependency graph, going up until it finds a page component.
// This could be a .astro page or a .md page.
export function* getTopLevelPages(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo }
): Generator<[ModuleInfo, number], void, unknown> {
	for (const res of walkParentInfos(id, ctx)) {
		if (moduleIsTopLevelPage(res[0])) {
			yield res;
		}
	}
}
