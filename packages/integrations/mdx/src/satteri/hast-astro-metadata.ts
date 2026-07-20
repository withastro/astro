import type { AstroMetadata } from '@astrojs/internal-helpers/markdown';
import { createDefaultAstroMetadata, resolvePath } from 'astro/markdown';
import type { Identifier, Literal } from 'estree';
import {
	defineHastPlugin,
	type EstreeProgram,
	type HastPluginDefinition,
	type HastVisitorContext,
} from 'satteri';
import { findAttrValue, hasDirective, isComponent, type MdxJsxHastNode } from './jsx-utils.js';

export type { AstroMetadata };

declare module 'satteri' {
	interface DataMap {
		__astroMetadata: AstroMetadata;
	}
}

type ImportSpecifier = { local: string; imported: string };
type MatchedImport = { name: string; path: string };

function exportNameToString(name: Identifier | Literal): string {
	return name.type === 'Identifier' ? name.name : String(name.value);
}

function collectImportsFromEsm(
	program: EstreeProgram,
	imports: Map<string, Set<ImportSpecifier>>,
): void {
	for (const stmt of program.body) {
		if (stmt.type !== 'ImportDeclaration') continue;
		const source = String(stmt.source.value);

		let specSet = imports.get(source);
		if (!specSet) {
			specSet = new Set();
			imports.set(source, specSet);
		}

		for (const spec of stmt.specifiers) {
			switch (spec.type) {
				case 'ImportDefaultSpecifier':
					specSet.add({ local: spec.local.name, imported: 'default' });
					break;
				case 'ImportNamespaceSpecifier':
					specSet.add({ local: spec.local.name, imported: '*' });
					break;
				case 'ImportSpecifier':
					specSet.add({
						local: spec.local.name,
						imported: exportNameToString(spec.imported),
					});
					break;
			}
		}
	}
}

function findMatchingImport(
	tagName: string,
	imports: Map<string, Set<ImportSpecifier>>,
): MatchedImport | undefined {
	const tagSpecifier = tagName.split('.')[0];
	for (const [source, specs] of imports) {
		for (const { imported, local } of specs) {
			if (local === tagSpecifier) {
				if (tagSpecifier !== tagName) {
					switch (imported) {
						case '*': {
							const accessPath = tagName.slice(tagSpecifier.length + 1);
							return { name: accessPath, path: source };
						}
						case 'default': {
							const accessPath = tagName.slice(tagSpecifier.length + 1);
							return { name: `default.${accessPath}`, path: source };
						}
						default: {
							return { name: tagName, path: source };
						}
					}
				}
				return { name: imported, path: source };
			}
		}
	}
}

function processJsxNode(
	node: MdxJsxHastNode,
	ctx: HastVisitorContext,
	imports: Map<string, Set<ImportSpecifier>>,
	filePath: string,
) {
	const tagName = node.name;
	if (!tagName || !isComponent(tagName)) return;

	const hasClient = hasDirective(node, 'client:');
	const hasServerDefer = !hasClient && hasDirective(node, 'server:defer');
	if (!hasClient && !hasServerDefer) return;

	const matchedImport = findMatchingImport(tagName, imports);
	if (!matchedImport) {
		throw new Error(
			`Expected a matching import for component \`${tagName}\`. Did you forget to import it?`,
		);
	}

	if (matchedImport.path.endsWith('.astro') && hasClient) {
		let clientAttr = 'client:*';
		for (const a of node.attributes) {
			if (a.type === 'mdxJsxAttribute' && a.name.startsWith('client:')) {
				clientAttr = a.name;
				break;
			}
		}
		console.warn(
			`You are attempting to render <${tagName} ${clientAttr} />, but ${tagName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`,
		);
	}

	const resolvedPath = resolvePath(matchedImport.path, filePath);
	const exportName =
		matchedImport.name === '*' ? tagName.split('.').slice(1).join('.') : matchedImport.name;

	const metadata = (ctx.data.__astroMetadata ??= createDefaultAstroMetadata());
	if (hasClient && findAttrValue(node, 'client:only') !== null) {
		metadata.clientOnlyComponents.push({
			exportName: matchedImport.name,
			localName: '',
			specifier: tagName,
			resolvedPath,
		});
		ctx.setProperty(node, 'client:display-name', tagName);
		ctx.setProperty(node, 'client:component-path', resolvedPath);
		ctx.setProperty(node, 'client:component-export', exportName);
		ctx.setProperty(node, 'client:component-hydration', '');
	} else if (hasClient) {
		metadata.hydratedComponents.push({
			exportName: '*',
			localName: '',
			specifier: tagName,
			resolvedPath,
		});
		ctx.setProperty(node, 'client:component-path', resolvedPath);
		ctx.setProperty(node, 'client:component-export', exportName);
		ctx.setProperty(node, 'client:component-hydration', '');
	} else if (hasServerDefer) {
		metadata.serverComponents.push({
			exportName: matchedImport.name,
			localName: tagName,
			specifier: matchedImport.path,
			resolvedPath,
		});
		ctx.setProperty(node, 'server:component-directive', 'server:defer');
		ctx.setProperty(node, 'server:component-path', resolvedPath);
		ctx.setProperty(node, 'server:component-export', exportName);
	}
}

export function createAstroMetadataPlugin(filePath: string): HastPluginDefinition {
	const imports = new Map<string, Set<ImportSpecifier>>();
	return defineHastPlugin({
		name: 'astro-metadata',
		mdxjsEsm(node) {
			const program = node.parseExpression();
			if (program) {
				collectImportsFromEsm(program, imports);
			}
		},

		mdxJsxFlowElement: {
			filter: [],
			visit(node, ctx) {
				processJsxNode(node, ctx, imports, filePath);
			},
		},

		mdxJsxTextElement: {
			filter: [],
			visit(node, ctx) {
				processJsxNode(node, ctx, imports, filePath);
			},
		},
	});
}
