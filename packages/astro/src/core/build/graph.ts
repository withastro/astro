import type { GetModuleInfo, ModuleInfo, PluginContext } from 'rollup';

import { ASTRO_PAGE_RESOLVED_MODULE_ID } from './plugins/plugin-pages.js';
import type { ExportDefaultDeclaration, ExportNamedDeclaration, ImportDeclaration } from 'estree';
import { walk } from 'estree-walker';

// This walks up the dependency graph and yields out each ModuleInfo object.
export function* walkParentInfos(
	id: string,
	ctx: { getModuleInfo: GetModuleInfo },
	until?: (importer: string) => boolean,
	depth = 0,
	order = 0,
	seen = new Set<string>(),
	childId = ''
): Generator<[ModuleInfo, number, number], void, unknown> {
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

		yield [info, depth, order];
	}
	if (until?.(id)) return;
	const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
	for (const imp of importers) {
		if (seen.has(imp)) {
			continue;
		}
		yield* walkParentInfos(imp, ctx, until, depth + 1, order, seen, id);
	}
}

export async function* walkParentInfosTrackingImports(
	id: string,
	ctx: PluginContext,
	until?: (importer: string) => boolean,
): AsyncGenerator<[ModuleInfo, number, number], void, unknown> {
	const depthsToChildren = new Map<number, ModuleInfo>();
	const depthsToExportNames = new Map<number, string[] | 'dynamic'>();
	// The component export from the original component file will always be default.
	depthsToExportNames.set(0, ['default']);

	for (const res of walkParentInfos(id, ctx, until)) {
		const [parentInfo, depth] = res;
		depthsToChildren.set(depth, parentInfo);
		if (depth > 0) {
				// Check if the component is actually imported:
				const childInfo = depthsToChildren.get(depth - 1);
				const childExportNames = depthsToExportNames.get(depth - 1);

				const doesImport = await doesParentImportChild(
					ctx,
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
		yield res;
	}
}


/**
 * @returns 'no' if the parent does not import the child,
 *          'dynamic' if it imports it dynamically,
 *          string[] of the reexports if it imports it statically
 */
async function doesParentImportChild(
	ctx: PluginContext,
	parentInfo: ModuleInfo,
	childInfo: ModuleInfo | undefined,
	childExportNames: string[] | 'dynamic' | undefined
): Promise<'no' | 'dynamic' | string[]> {
	if (!childInfo || !parentInfo.ast || !childExportNames) return 'no';

	if (childExportNames === 'dynamic' || parentInfo.dynamicallyImportedIds?.includes(childInfo.id)) {
		return 'dynamic';
	}

	const imports: Array<ImportDeclaration> = [];
	const exports: Array<ExportNamedDeclaration | ExportDefaultDeclaration> = [];
	walk(parentInfo.ast, {
		enter(node) {
			if (node.type === 'ImportDeclaration') {
				imports.push(node as ImportDeclaration);
			} else if (
				node.type === 'ExportDefaultDeclaration' ||
				node.type === 'ExportNamedDeclaration'
			) {
				exports.push(node as ExportNamedDeclaration | ExportDefaultDeclaration);
			}
		},
	});
	// All of the aliases the current component is imported as
	const importNames: string[] = [];
	// All of the aliases the child component is exported as
	const exportNames: string[] = [];

	for (const node of imports) {
		const resolved = await ctx.resolve(node.source.value as string, parentInfo.id);
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
	for (const node of exports) {
		if (node.type === 'ExportDefaultDeclaration') {
			if (node.declaration.type === 'Identifier' && importNames.includes(node.declaration.name)) {
				exportNames.push('default');
				// return
			}
		} else {
			// handle `export { x } from 'something';`, where the export and import are in the same node
			if (node.source) {
				const resolved = await ctx.resolve(node.source.value as string, parentInfo.id);
				if (!resolved || resolved.id !== childInfo.id) continue;
				for (const specifier of node.specifiers) {
					if (childExportNames.includes(specifier.local.name)) {
						importNames.push(specifier.local.name);
						exportNames.push(specifier.exported.name);
					}
				}
			}
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

// Returns true if a module is a top-level page. We determine this based on whether
// it is imported by the top-level virtual module.
export function moduleIsTopLevelPage(info: ModuleInfo): boolean {
	return (
		info.importers[0]?.includes(ASTRO_PAGE_RESOLVED_MODULE_ID) ||
		info.dynamicImporters[0]?.includes(ASTRO_PAGE_RESOLVED_MODULE_ID)
	);
}

// This function walks the dependency graph, going up until it finds a page component.
// This could be a .astro page, a .markdown or a .md (or really any file extension for markdown files) page.
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
