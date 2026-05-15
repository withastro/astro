import { prependForwardSlash, removeFileExtension } from '../path.js';
import { viteID } from '../util.js';
function createBuildInternals() {
	return {
		clientInput: /* @__PURE__ */ new Set(),
		cssModuleToChunkIdMap: /* @__PURE__ */ new Map(),
		inlinedScripts: /* @__PURE__ */ new Map(),
		entrySpecifierToBundleMap: /* @__PURE__ */ new Map(),
		pagesByKeys: /* @__PURE__ */ new Map(),
		pagesByViteID: /* @__PURE__ */ new Map(),
		pagesByClientOnly: /* @__PURE__ */ new Map(),
		pagesByScriptId: /* @__PURE__ */ new Map(),
		pagesByHydratedComponent: /* @__PURE__ */ new Map(),
		propagatedStylesMap: /* @__PURE__ */ new Map(),
		discoveredHydratedComponents: /* @__PURE__ */ new Map(),
		discoveredClientOnlyComponents: /* @__PURE__ */ new Map(),
		discoveredScripts: /* @__PURE__ */ new Set(),
		staticFiles: /* @__PURE__ */ new Set(),
		componentMetadata: /* @__PURE__ */ new Map(),
		astroActionsEntryPoint: void 0,
		middlewareEntryPoint: void 0,
		loggerEntryPoint: void 0,
		clientChunksAndAssets: /* @__PURE__ */ new Set(),
		ssrAssetsPerEnvironment: /* @__PURE__ */ new Map(),
	};
}
function getOrCreateSSRAssets(internals, envName) {
	const key = envName;
	let assets = internals.ssrAssetsPerEnvironment.get(key);
	if (!assets) {
		assets = /* @__PURE__ */ new Set();
		internals.ssrAssetsPerEnvironment.set(key, assets);
	}
	return assets;
}
function getSSRAssets(internals, envName) {
	return internals.ssrAssetsPerEnvironment.get(envName) ?? /* @__PURE__ */ new Set();
}
function trackPageData(internals, _component, pageData, componentModuleId, componentURL) {
	pageData.moduleSpecifier = componentModuleId;
	internals.pagesByKeys.set(pageData.key, pageData);
	internals.pagesByViteID.set(viteID(componentURL), pageData);
}
function trackClientOnlyPageDatas(internals, pageData, clientOnlys) {
	for (const clientOnlyComponent of clientOnlys) {
		let pageDataSet;
		if (internals.pagesByClientOnly.has(clientOnlyComponent)) {
			pageDataSet = internals.pagesByClientOnly.get(clientOnlyComponent);
		} else {
			pageDataSet = /* @__PURE__ */ new Set();
			internals.pagesByClientOnly.set(clientOnlyComponent, pageDataSet);
		}
		pageDataSet.add(pageData);
	}
}
function trackScriptPageDatas(internals, pageData, scriptIds) {
	for (const scriptId of scriptIds) {
		let pageDataSet;
		if (internals.pagesByScriptId.has(scriptId)) {
			pageDataSet = internals.pagesByScriptId.get(scriptId);
		} else {
			pageDataSet = /* @__PURE__ */ new Set();
			internals.pagesByScriptId.set(scriptId, pageDataSet);
		}
		pageDataSet.add(pageData);
	}
}
function trackHydratedComponentPageDatas(internals, pageData, hydratedComponents) {
	for (const hydratedComponent of hydratedComponents) {
		let pageDataSet;
		if (internals.pagesByHydratedComponent.has(hydratedComponent)) {
			pageDataSet = internals.pagesByHydratedComponent.get(hydratedComponent);
		} else {
			pageDataSet = /* @__PURE__ */ new Set();
			internals.pagesByHydratedComponent.set(hydratedComponent, pageDataSet);
		}
		pageDataSet.add(pageData);
	}
}
function* getPageDatasByClientOnlyID(internals, viteid) {
	const pagesByClientOnly = internals.pagesByClientOnly;
	if (pagesByClientOnly.size) {
		let pageBuildDatas = pagesByClientOnly.get(viteid);
		if (!pageBuildDatas) {
			let pathname = `/@fs${prependForwardSlash(viteid)}`;
			pageBuildDatas = pagesByClientOnly.get(pathname);
		}
		if (!pageBuildDatas) {
			let pathname = `/@fs${prependForwardSlash(removeFileExtension(viteid))}`;
			pageBuildDatas = pagesByClientOnly.get(pathname);
		}
		if (pageBuildDatas) {
			for (const pageData of pageBuildDatas) {
				yield pageData;
			}
		}
	}
}
function getPageDataByViteID(internals, viteid) {
	if (internals.pagesByViteID.has(viteid)) {
		return internals.pagesByViteID.get(viteid);
	}
	return void 0;
}
function hasPrerenderedPages(internals) {
	for (const pageData of internals.pagesByKeys.values()) {
		if (pageData.route.prerender) {
			return true;
		}
	}
	return false;
}
export {
	createBuildInternals,
	getOrCreateSSRAssets,
	getPageDataByViteID,
	getPageDatasByClientOnlyID,
	getSSRAssets,
	hasPrerenderedPages,
	trackClientOnlyPageDatas,
	trackHydratedComponentPageDatas,
	trackPageData,
	trackScriptPageDatas,
};
