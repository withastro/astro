import { isCSSRequest } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import { isPropagatedAssetBoundary } from '../../head-propagation/boundary.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../../vite-plugin-pages/const.js';
import {
	getParentExtendedModuleInfos,
	getParentModuleInfos,
	moduleIsTopLevelPage,
} from '../graph.js';
import { getPageDataByViteID, getPageDatasByClientOnlyID } from '../internal.js';
import { normalizeEntryId } from './plugin-component-entry.js';
import { shouldInlineAsset } from './util.js';
function pluginCSS(options, internals) {
	return rollupPluginAstroBuildCSS({
		buildOptions: options,
		internals,
	});
}
function isBuildCssBoundary(id, ctx) {
	if (isPropagatedAssetBoundary(id)) return true;
	const info = ctx.getModuleInfo(id);
	if (!info || !moduleIsTopLevelPage(info)) return false;
	const allImporters = info.importers.concat(info.dynamicImporters);
	const hasNonVirtualPageImporter = allImporters.some(
		(importer) => !importer.includes(VIRTUAL_PAGE_RESOLVED_MODULE_ID),
	);
	return !hasNonVirtualPageImporter;
}
function rollupPluginAstroBuildCSS(options) {
	const { internals, buildOptions } = options;
	const { settings } = buildOptions;
	let resolvedConfig;
	const pagesToCss = {};
	const moduleIdToPropagatedCss = {};
	const cssBuildPlugin = {
		name: 'astro:rollup-plugin-build-css',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		async generateBundle(_outputOptions, bundle) {
			if (
				this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			) {
				for (const [, chunk] of Object.entries(bundle)) {
					if (chunk.type !== 'chunk') continue;
					for (const moduleId of Object.keys(chunk.modules || {})) {
						if (isCSSRequest(moduleId)) {
							internals.cssModuleToChunkIdMap.set(moduleId, chunk.fileName);
						}
					}
				}
			}
			const renderedComponentExports = /* @__PURE__ */ new Map();
			const componentToPages = /* @__PURE__ */ new Map();
			if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
				for (const [, item] of Object.entries(bundle)) {
					if (item.type !== 'chunk') continue;
					for (const [moduleId, moduleRenderedInfo] of Object.entries(item.modules)) {
						if (moduleRenderedInfo.renderedExports.length > 0) {
							renderedComponentExports.set(moduleId, moduleRenderedInfo.renderedExports);
							if (item.facadeModuleId) {
								let pages = componentToPages.get(moduleId);
								if (!pages) {
									pages = /* @__PURE__ */ new Set();
									componentToPages.set(moduleId, pages);
								}
								pages.add(item.facadeModuleId);
							}
						}
					}
					if ('viteMetadata' in item === false) continue;
					const meta = item.viteMetadata;
					const allModules = Object.keys(item.modules || {});
					const cssModules = allModules.filter((m) => isCSSRequest(m));
					if (cssModules.length > 0) {
						const allCssInSSR = cssModules.every((moduleId) =>
							internals.cssModuleToChunkIdMap.has(moduleId),
						);
						if (allCssInSSR && shouldDeleteCSSChunk(allModules, internals)) {
							for (const cssId of meta.importedCss) {
								delete bundle[cssId];
							}
						}
					}
				}
			}
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type !== 'chunk') continue;
				if ('viteMetadata' in chunk === false) continue;
				const meta = chunk.viteMetadata;
				if (meta.importedCss.size < 1) continue;
				if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
					for (const id of Object.keys(chunk.modules)) {
						for (const pageData of getParentClientOnlys(id, this, internals)) {
							for (const importedCssImport of meta.importedCss) {
								const cssToInfoRecord = (pagesToCss[pageData.moduleSpecifier] ??= {});
								cssToInfoRecord[importedCssImport] = { depth: -1, order: -1 };
							}
						}
					}
					for (const id of Object.keys(chunk.modules)) {
						const moduleInfo = this.getModuleInfo(id);
						const cssScopeTo = moduleInfo?.meta?.vite?.cssScopeTo;
						if (cssScopeTo) {
							const [scopedToModule, scopedToExport] = cssScopeTo;
							const renderedExports = renderedComponentExports.get(scopedToModule);
							if (renderedExports?.includes(scopedToExport)) {
								const parentModuleInfos = getParentExtendedModuleInfos(
									scopedToModule,
									this,
									(moduleId) => isBuildCssBoundary(moduleId, this),
								);
								for (const { info: pageInfo, depth, order } of parentModuleInfos) {
									if (moduleIsTopLevelPage(pageInfo)) {
										const pageData = getPageDataByViteID(internals, pageInfo.id);
										if (pageData) {
											appendCSSToPage(
												pageData,
												meta,
												pagesToCss,
												depth,
												order,
												this.environment?.name,
											);
										}
									}
									const pageDatas = internals.pagesByScriptId.get(pageInfo.id);
									if (pageDatas) {
										for (const pageData of pageDatas) {
											appendCSSToPage(
												pageData,
												meta,
												pagesToCss,
												-1,
												order,
												this.environment?.name,
											);
										}
									}
								}
								let addedToAnyPage = false;
								for (const importedCssImport of meta.importedCss) {
									for (const pageData of internals.pagesByKeys.values()) {
										const cssToInfoRecord = pagesToCss[pageData.moduleSpecifier];
										if (cssToInfoRecord && importedCssImport in cssToInfoRecord) {
											addedToAnyPage = true;
											break;
										}
									}
								}
								if (!addedToAnyPage) {
									for (const { info: parentInfo } of parentModuleInfos) {
										const normalizedParent = normalizeEntryId(parentInfo.id);
										const pages = internals.pagesByHydratedComponent.get(normalizedParent);
										if (pages) {
											for (const pageData of pages) {
												appendCSSToPage(pageData, meta, pagesToCss, -1, -1, this.environment?.name);
											}
										}
									}
								}
							}
						}
					}
				}
				for (const id of Object.keys(chunk.modules)) {
					if (!isCSSRequest(id)) continue;
					const parentModuleInfos = getParentExtendedModuleInfos(id, this, (importer) =>
						isBuildCssBoundary(importer, this),
					);
					for (const { info: pageInfo, depth, order } of parentModuleInfos) {
						if (isPropagatedAssetBoundary(pageInfo.id)) {
							const propagatedCss = (moduleIdToPropagatedCss[pageInfo.id] ??=
								/* @__PURE__ */ new Set());
							for (const css of meta.importedCss) {
								propagatedCss.add(css);
							}
						} else if (moduleIsTopLevelPage(pageInfo)) {
							const pageViteID = pageInfo.id;
							const pageData = getPageDataByViteID(internals, pageViteID);
							if (pageData) {
								appendCSSToPage(pageData, meta, pagesToCss, depth, order, this.environment?.name);
							}
						} else if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
							const pageDatas = internals.pagesByScriptId.get(pageInfo.id);
							if (pageDatas) {
								for (const pageData of pageDatas) {
									appendCSSToPage(pageData, meta, pagesToCss, -1, order, this.environment?.name);
								}
							}
						}
					}
				}
			}
		},
	};
	const singleCssPlugin = {
		name: 'astro:rollup-plugin-single-css',
		enforce: 'post',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configResolved(config) {
			resolvedConfig = config;
		},
		generateBundle(_, bundle) {
			if (resolvedConfig.build.cssCodeSplit) return;
			const cssChunk = Object.values(bundle).find(
				(chunk) => chunk.type === 'asset' && chunk.name === 'style.css',
			);
			if (cssChunk === void 0) return;
			for (const pageData of internals.pagesByKeys.values()) {
				const cssToInfoMap = (pagesToCss[pageData.moduleSpecifier] ??= {});
				cssToInfoMap[cssChunk.fileName] = { depth: -1, order: -1 };
			}
		},
	};
	let assetsInlineLimit;
	const inlineStylesheetsPlugin = {
		name: 'astro:rollup-plugin-inline-stylesheets',
		enforce: 'post',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configResolved(config) {
			assetsInlineLimit = config.build.assetsInlineLimit;
		},
		async generateBundle(_outputOptions, bundle) {
			const inlineConfig = settings.config.build.inlineStylesheets;
			Object.entries(bundle).forEach(([id, stylesheet]) => {
				if (
					stylesheet.type !== 'asset' ||
					stylesheet.name?.endsWith('.css') !== true ||
					typeof stylesheet.source !== 'string'
				)
					return;
				if (stylesheet.source.length === 0) {
					delete bundle[id];
					return;
				}
				const toBeInlined =
					inlineConfig === 'always'
						? true
						: inlineConfig === 'never'
							? false
							: shouldInlineAsset(stylesheet.source, stylesheet.fileName, assetsInlineLimit);
				const sheet = toBeInlined
					? { type: 'inline', content: stylesheet.source }
					: { type: 'external', src: stylesheet.fileName };
				let sheetAddedToPage = false;
				internals.pagesByKeys.forEach((pageData) => {
					const orderingInfo = pagesToCss[pageData.moduleSpecifier]?.[stylesheet.fileName];
					if (orderingInfo !== void 0) {
						const alreadyAdded = pageData.styles.some((s) => {
							if (s.sheet.type === 'external' && sheet.type === 'external') {
								return s.sheet.src === sheet.src;
							}
							if (s.sheet.type === 'inline' && sheet.type === 'inline') {
								return s.sheet.content === sheet.content;
							}
							return false;
						});
						if (!alreadyAdded) {
							pageData.styles.push({ ...orderingInfo, sheet });
						}
						sheetAddedToPage = true;
					}
				});
				for (const moduleId in moduleIdToPropagatedCss) {
					if (!moduleIdToPropagatedCss[moduleId].has(stylesheet.fileName)) continue;
					let propagatedStyles = internals.propagatedStylesMap.get(moduleId);
					if (!propagatedStyles) {
						propagatedStyles = /* @__PURE__ */ new Set();
						internals.propagatedStylesMap.set(moduleId, propagatedStyles);
					}
					propagatedStyles.add(sheet);
					sheetAddedToPage = true;
				}
				const wasInlined = toBeInlined && sheetAddedToPage;
				const wasAddedToChunk = Object.values(bundle).some(
					(chunk) => chunk.type === 'chunk' && chunk.viteMetadata?.importedAssets?.has(id),
				);
				const isOrphaned = !sheetAddedToPage && !wasAddedToChunk;
				if (wasInlined || isOrphaned) {
					delete bundle[id];
					for (const chunk of Object.values(bundle)) {
						if (chunk.type === 'chunk') {
							chunk.viteMetadata?.importedCss?.delete(id);
						}
					}
				}
			});
		},
	};
	return [cssBuildPlugin, singleCssPlugin, inlineStylesheetsPlugin];
}
function shouldDeleteCSSChunk(allModules, internals) {
	const componentPaths = /* @__PURE__ */ new Set();
	for (const componentPath of internals.discoveredClientOnlyComponents.keys()) {
		if (allModules.some((m) => m.includes(componentPath))) {
			componentPaths.add(componentPath);
		}
	}
	for (const componentPath of internals.discoveredHydratedComponents.keys()) {
		if (allModules.some((m) => m.includes(componentPath))) {
			componentPaths.add(componentPath);
		}
	}
	if (componentPaths.size === 0) return false;
	for (const componentPath of componentPaths) {
		const pagesUsingClientOnly = internals.pagesByClientOnly.get(componentPath);
		if (pagesUsingClientOnly) {
			for (const pageData of internals.pagesByKeys.values()) {
				if (!pagesUsingClientOnly.has(pageData)) {
					return false;
				}
			}
		}
	}
	return true;
}
function* getParentClientOnlys(id, ctx, internals) {
	for (const info of getParentModuleInfos(id, ctx)) {
		yield* getPageDatasByClientOnlyID(internals, info.id);
	}
}
function appendCSSToPage(pageData, meta, pagesToCss, depth, order, environmentName) {
	if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr && pageData.route.prerender) {
		return;
	}
	if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender && !pageData.route.prerender) {
		return;
	}
	for (const importedCssImport of meta.importedCss) {
		const cssInfo = pagesToCss[pageData.moduleSpecifier]?.[importedCssImport];
		if (cssInfo !== void 0) {
			if (depth < cssInfo.depth) {
				cssInfo.depth = depth;
			}
			if (cssInfo.order === -1) {
				cssInfo.order = order;
			} else if (order < cssInfo.order && order > -1) {
				cssInfo.order = order;
			}
		} else {
			const cssToInfoRecord = (pagesToCss[pageData.moduleSpecifier] ??= {});
			cssToInfoRecord[importedCssImport] = { depth, order };
		}
	}
}
export { pluginCSS };
