import type { GetModuleInfo, ModuleInfo } from 'rollup';
import { resolvedPagesVirtualModuleId } from '../app/index.js';

// This walks up the dependency graph and yields out each ModuleInfo object.
export function* walkParentInfos(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo },
	seen = new Set<string>()
): Generator<ModuleInfo, void, unknown> {
	seen.add(id);
	const info = ctx.getModuleInfo(id);
	if (info) {
		yield info;
	}
	const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
	for (const imp of importers) {
		if (seen.has(imp)) {
			continue;
		}
		yield* walkParentInfos(imp, ctx, seen);
	}
}

// This function walks the dependency graph, going up until it finds a page component.
// This could be a .astro page or a .md page.
export function* getTopLevelPages(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo }
): Generator<string, void, unknown> {
	for (const info of walkParentInfos(id, ctx)) {
		const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
		if (importers.length <= 2 && importers[0] === resolvedPagesVirtualModuleId) {
			yield info.id;
		}
	}
}
