import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../vite-plugin-pages/const.js';
function getParentExtendedModuleInfos(
	id,
	ctx,
	until,
	depth = 0,
	order = 0,
	childId = '',
	seen = /* @__PURE__ */ new Set(),
	accumulated = [],
) {
	seen.add(id);
	const info = ctx.getModuleInfo(id);
	if (info) {
		if (childId) {
			const idx = info.importedIds.indexOf(childId);
			if (idx === -1) {
				order += info.importedIds.length;
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
function getParentModuleInfos(id, ctx, until, seen = /* @__PURE__ */ new Set(), accumulated = []) {
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
function moduleIsTopLevelPage(info) {
	return (
		info.importers[0]?.includes(VIRTUAL_PAGE_RESOLVED_MODULE_ID) ||
		info.dynamicImporters[0]?.includes(VIRTUAL_PAGE_RESOLVED_MODULE_ID)
	);
}
function getTopLevelPageModuleInfos(id, ctx) {
	return getParentModuleInfos(id, ctx).filter(moduleIsTopLevelPage);
}
export {
	getParentExtendedModuleInfos,
	getParentModuleInfos,
	getTopLevelPageModuleInfos,
	moduleIsTopLevelPage,
};
