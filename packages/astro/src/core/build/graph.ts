import type { GetModuleInfo, ModuleInfo } from 'rollup';

import { resolvedPagesVirtualModuleId } from '../app/index.js';

// This walks up the dependency graph and yields out each ModuleInfo object.
export function* walkParentInfos(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo },
	depth = 0,
	seen = new Set<string>(),
	childId = ''
): Generator<[ModuleInfo, number, number], void, unknown> {
	seen.add(id);
	const info = ctx.getModuleInfo(id);
	if (info) {
		let order = childId ? info.importedIds.indexOf(childId) : 0;
		yield [info, depth, order];
	}
	const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
	for (const imp of importers) {
		if (seen.has(imp)) {
			continue;
		}
		yield* walkParentInfos(imp, ctx, ++depth, seen, id);
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
): Generator<[ModuleInfo, number, number], void, unknown> {
	for (const res of walkParentInfos(id, ctx)) {
		if (moduleIsTopLevelPage(res[0])) {
			yield res;
		}
	}
}
