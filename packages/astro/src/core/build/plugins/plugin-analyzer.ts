import type { ModuleInfo, PluginContext } from 'rollup';
import type { Plugin as VitePlugin } from 'vite';
import type { PluginMetadata as AstroPluginMetadata } from '../../../vite-plugin-astro/types.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';

import type { ExportDefaultDeclaration, ExportNamedDeclaration, ImportDeclaration } from 'estree';
import { PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import { prependForwardSlash } from '../../../core/path.js';
import { getTopLevelPages, moduleIsTopLevelPage, walkParentInfos } from '../graph.js';
import { getPageDataByViteID, trackClientOnlyPageDatas } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';

function isPropagatedAsset(id: string) {
	try {
		return new URL('file://' + id).searchParams.has(PROPAGATED_ASSET_FLAG);
	} catch {
		return false;
	}
}

/**
 * @returns undefined if the parent does not import the child, string[] of the reexports if it does
 */
async function doesParentImportChild(
	this: PluginContext,
	parentInfo: ModuleInfo,
	childInfo: ModuleInfo | undefined,
	childExportNames: string[] | 'dynamic' | undefined
): Promise<'no' | 'dynamic' | string[]> {
	if (!childInfo || !parentInfo.ast || !childExportNames) return 'no';

	// If we're dynamically importing the child, return `dynamic` directly to opt-out of optimization
	if (childExportNames === 'dynamic' || parentInfo.dynamicallyImportedIds?.includes(childInfo.id)) {
		return 'dynamic';
	}

	const imports: Array<ImportDeclaration> = [];
	const exports: Array<ExportNamedDeclaration | ExportDefaultDeclaration> = [];
	for (const node of (parentInfo.ast as any).body) {
		if (node.type === 'ImportDeclaration') {
			imports.push(node);
		} else if (node.type === 'ExportDefaultDeclaration' || node.type === 'ExportNamedDeclaration') {
			exports.push(node);
		}
	}

	// All local import names that could be importing the child component
	const importNames: string[] = [];
	// All of the aliases the child component is exported as
	const exportNames: string[] = [];

	// Iterate each import, find it they import the child component, if so, check if they
	// import the child component name specifically. We can verify this with `childExportNames`.
	for (const node of imports) {
		const resolved = await this.resolve(node.source.value as string, parentInfo.id);
		if (!resolved || resolved.id !== childInfo.id) continue;
		for (const specifier of node.specifiers) {
			// TODO: handle these?
			if (specifier.type === 'ImportNamespaceSpecifier') continue;
			const name =
				specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.imported.name;
			// If we're importing the thing that the child exported, store the local name of what we imported
			if (childExportNames.includes(name)) {
				importNames.push(specifier.local.name);
			}
		}
	}

	// Iterate each export, find it they re-export the child component, and push the exported name to `exportNames`
	for (const node of exports) {
		if (node.type === 'ExportDefaultDeclaration') {
			if (node.declaration.type === 'Identifier' && importNames.includes(node.declaration.name)) {
				exportNames.push('default');
			}
		} else {
			// Handle:
			// export { Component } from './Component.astro'
			// export { Component as AliasedComponent } from './Component.astro'
			if (node.source) {
				const resolved = await this.resolve(node.source.value as string, parentInfo.id);
				if (!resolved || resolved.id !== childInfo.id) continue;
				for (const specifier of node.specifiers) {
					if (childExportNames.includes(specifier.local.name)) {
						importNames.push(specifier.local.name);
						exportNames.push(specifier.exported.name);
					}
				}
			}
			// Handle:
			// export const AliasedComponent = Component
			// export const AliasedComponent = Component, let foo = 'bar'
			if (node.declaration) {
				if (node.declaration.type !== 'VariableDeclaration') continue;
				for (const declarator of node.declaration.declarations) {
					if (declarator.init?.type !== 'Identifier') continue;
					if (declarator.id.type !== 'Identifier') continue;
					if (importNames.includes(declarator.init.name)) {
						exportNames.push(declarator.id.name);
					}
				}
			}
			// Handle:
			// export { Component }
			// export { Component as AliasedComponent }
			for (const specifier of node.specifiers) {
				if (importNames.includes(specifier.local.name)) {
					exportNames.push(specifier.exported.name);
				}
			}
		}
	}
	if (!importNames.length) return 'no';

	// If the component is imported by another component, assume it's in use
	// and start tracking this new component now
	if (parentInfo.id.endsWith('.astro')) {
		exportNames.push('default');
	} else if (parentInfo.id.endsWith('.mdx')) {
		exportNames.push('Content');
	}

	return exportNames;
}

export function vitePluginAnalyzer(
	options: StaticBuildOptions,
	internals: BuildInternals
): VitePlugin {
	function hoistedScriptScanner() {
		const uniqueHoistedIds = new Map<string, string>();
		const pageScripts = new Map<
			string,
			{
				hoistedSet: Set<string>;
				propagatedMapByImporter: Map<string, Set<string>>;
			}
		>();

		return {
			async scan(
				this: PluginContext,
				scripts: AstroPluginMetadata['astro']['scripts'],
				from: string
			) {
				const hoistedScripts = new Set<string>();
				for (let i = 0; i < scripts.length; i++) {
					const hid = `${from.replace('/@fs', '')}?astro&type=script&index=${i}&lang.ts`;
					hoistedScripts.add(hid);
				}

				if (hoistedScripts.size) {
					// These variables are only used for hoisted script analysis optimization
					const depthsToChildren = new Map<number, ModuleInfo>();
					const depthsToExportNames = new Map<number, string[] | 'dynamic'>();
					// The component export from the original component file will always be default.
					depthsToExportNames.set(0, ['default']);

					for (const [parentInfo, depth] of walkParentInfos(from, this, function until(importer) {
						return isPropagatedAsset(importer);
					})) {
						// If hoisted script analysis optimization is enabled, try to analyse and bail early if possible
						if (options.settings.config.experimental.optimizeHoistedScript) {
							depthsToChildren.set(depth, parentInfo);
							// If at any point
							if (depth > 0) {
								// Check if the component is actually imported:
								const childInfo = depthsToChildren.get(depth - 1);
								const childExportNames = depthsToExportNames.get(depth - 1);

								const doesImport = await doesParentImportChild.call(
									this,
									parentInfo,
									childInfo,
									childExportNames
								);

								if (doesImport === 'no') {
									// Break the search if the parent doesn't import the child.
									continue;
								}
								depthsToExportNames.set(depth, doesImport);
							}
						}

						if (isPropagatedAsset(parentInfo.id)) {
							for (const [nestedParentInfo] of walkParentInfos(from, this)) {
								if (moduleIsTopLevelPage(nestedParentInfo)) {
									for (const hid of hoistedScripts) {
										if (!pageScripts.has(nestedParentInfo.id)) {
											pageScripts.set(nestedParentInfo.id, {
												hoistedSet: new Set(),
												propagatedMapByImporter: new Map(),
											});
										}
										const entry = pageScripts.get(nestedParentInfo.id)!;
										if (!entry.propagatedMapByImporter.has(parentInfo.id)) {
											entry.propagatedMapByImporter.set(parentInfo.id, new Set());
										}
										entry.propagatedMapByImporter.get(parentInfo.id)!.add(hid);
									}
								}
							}
						} else if (moduleIsTopLevelPage(parentInfo)) {
							for (const hid of hoistedScripts) {
								if (!pageScripts.has(parentInfo.id)) {
									pageScripts.set(parentInfo.id, {
										hoistedSet: new Set(),
										propagatedMapByImporter: new Map(),
									});
								}
								pageScripts.get(parentInfo.id)?.hoistedSet.add(hid);
							}
						}
					}
				}
			},

			finalize() {
				for (const [pageId, { hoistedSet, propagatedMapByImporter }] of pageScripts) {
					const pageData = getPageDataByViteID(internals, pageId);
					if (!pageData) continue;

					const { component } = pageData;
					const astroModuleId = prependForwardSlash(component);

					const uniqueHoistedId = JSON.stringify(Array.from(hoistedSet).sort());
					let moduleId: string;

					// If we're already tracking this set of hoisted scripts, get the unique id
					if (uniqueHoistedIds.has(uniqueHoistedId)) {
						moduleId = uniqueHoistedIds.get(uniqueHoistedId)!;
					} else {
						// Otherwise, create a unique id for this set of hoisted scripts
						moduleId = `/astro/hoisted.js?q=${uniqueHoistedIds.size}`;
						uniqueHoistedIds.set(uniqueHoistedId, moduleId);
					}
					internals.discoveredScripts.add(moduleId);

					pageData.propagatedScripts = propagatedMapByImporter;

					// Add propagated scripts to client build,
					// but DON'T add to pages -> hoisted script map.
					for (const propagatedScripts of propagatedMapByImporter.values()) {
						for (const propagatedScript of propagatedScripts) {
							internals.discoveredScripts.add(propagatedScript);
						}
					}

					// Make sure to track that this page uses this set of hoisted scripts
					if (internals.hoistedScriptIdToPagesMap.has(moduleId)) {
						const pages = internals.hoistedScriptIdToPagesMap.get(moduleId);
						pages!.add(astroModuleId);
					} else {
						internals.hoistedScriptIdToPagesMap.set(moduleId, new Set([astroModuleId]));
						internals.hoistedScriptIdToHoistedMap.set(moduleId, hoistedSet);
					}
				}
			},
		};
	}

	return {
		name: '@astro/rollup-plugin-astro-analyzer',
		async generateBundle() {
			const hoistScanner = hoistedScriptScanner();

			const ids = this.getModuleIds();

			for (const id of ids) {
				const info = this.getModuleInfo(id);
				if (!info?.meta?.astro) continue;

				const astro = info.meta.astro as AstroPluginMetadata['astro'];

				const pageData = getPageDataByViteID(internals, id);
				if (pageData) {
					internals.pageOptionsByPage.set(id, astro.pageOptions);
				}

				for (const c of astro.hydratedComponents) {
					const rid = c.resolvedPath ? decodeURI(c.resolvedPath) : c.specifier;
					if (internals.discoveredHydratedComponents.has(rid)) {
						const exportNames = internals.discoveredHydratedComponents.get(rid);
						exportNames?.push(c.exportName);
					} else {
						internals.discoveredHydratedComponents.set(rid, [c.exportName]);
					}
				}

				// Scan hoisted scripts
				await hoistScanner.scan.call(this, astro.scripts, id);

				if (astro.clientOnlyComponents.length) {
					const clientOnlys: string[] = [];

					for (const c of astro.clientOnlyComponents) {
						const cid = c.resolvedPath ? decodeURI(c.resolvedPath) : c.specifier;
						if (internals.discoveredClientOnlyComponents.has(cid)) {
							const exportNames = internals.discoveredClientOnlyComponents.get(cid);
							exportNames?.push(c.exportName);
						} else {
							internals.discoveredClientOnlyComponents.set(cid, [c.exportName]);
						}
						clientOnlys.push(cid);

						const resolvedId = await this.resolve(c.specifier, id);
						if (resolvedId) {
							clientOnlys.push(resolvedId.id);
						}
					}

					for (const [pageInfo] of getTopLevelPages(id, this)) {
						const newPageData = getPageDataByViteID(internals, pageInfo.id);
						if (!newPageData) continue;

						trackClientOnlyPageDatas(internals, newPageData, clientOnlys);
					}
				}
			}

			// Finalize hoisting
			hoistScanner.finalize();
		},
	};
}

export function pluginAnalyzer(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		targets: ['server', 'content'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginAnalyzer(options, internals),
				};
			},
		},
	};
}
