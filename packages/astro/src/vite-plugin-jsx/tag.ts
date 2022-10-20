import type { PluginObj } from '@babel/core';
import * as t from '@babel/types';
import { resolve as importMetaResolve } from 'import-meta-resolve';
import { fileURLToPath } from 'url';

/**
 * This plugin handles every file that runs through our JSX plugin.
 * Since we statically match every JSX file to an Astro renderer based on import scanning,
 * it would be helpful to embed some of that metadata at runtime.
 *
 * This plugin crawls each export in the file and "tags" each export with a given `rendererName`.
 * This allows us to automatically match a component to a renderer and skip the usual `check()` calls.
 */
export default async function tagExportsWithRenderer({
	rendererName,
	root,
}: {
	rendererName: string;
	root: URL;
}): Promise<PluginObj> {
	const astroServerPath = fileURLToPath(
		await importMetaResolve('astro/server/index.js', root.toString())
	);
	return {
		visitor: {
			Program: {
				// Inject `import { __astro_tag_component__ } from 'astro/server/index.js'`
				enter(path) {
					path.node.body.splice(
						0,
						0,
						t.importDeclaration(
							[
								t.importSpecifier(
									t.identifier('__astro_tag_component__'),
									t.identifier('__astro_tag_component__')
								),
							],
							t.stringLiteral(astroServerPath)
						)
					);
				},
				// For each export we found, inject `__astro_tag_component__(exportName, rendererName)`
				exit(path, state) {
					const exportedIds = state.get('astro:tags');
					if (exportedIds) {
						for (const id of exportedIds) {
							path.node.body.push(
								t.expressionStatement(
									t.callExpression(t.identifier('__astro_tag_component__'), [
										t.identifier(id),
										t.stringLiteral(rendererName),
									])
								)
							);
						}
					}
				},
			},
			ExportDeclaration: {
				/**
				 * For default anonymous function export, we need to give them a unique name
				 * @param path
				 * @returns
				 */
				enter(path) {
					const node = path.node;
					if (node.type !== 'ExportDefaultDeclaration') return;

					if (node.declaration?.type === 'ArrowFunctionExpression') {
						const uidIdentifier = path.scope.generateUidIdentifier('_arrow_function');
						path.insertBefore(
							t.variableDeclaration('const', [
								t.variableDeclarator(uidIdentifier, node.declaration),
							])
						);
						node.declaration = uidIdentifier;
					} else if (
						node.declaration?.type === 'FunctionDeclaration' &&
						!node.declaration.id?.name
					) {
						const uidIdentifier = path.scope.generateUidIdentifier('_function');
						node.declaration.id = uidIdentifier;
					}
				},
				exit(path, state) {
					const node = path.node;
					if (node.exportKind === 'type') return;
					if (node.type === 'ExportAllDeclaration') return;
					const addTag = (id: string) => {
						const tags = state.get('astro:tags') ?? [];
						state.set('astro:tags', [...tags, id]);
					};
					if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
						if (t.isIdentifier(node.declaration)) {
							addTag(node.declaration.name);
						} else if (t.isFunctionDeclaration(node.declaration) && node.declaration.id?.name) {
							addTag(node.declaration.id.name);
						} else if (t.isVariableDeclaration(node.declaration)) {
							node.declaration.declarations?.forEach((declaration) => {
								if (
									t.isArrowFunctionExpression(declaration.init) &&
									t.isIdentifier(declaration.id)
								) {
									addTag(declaration.id.name);
								}
							});
						} else if (t.isObjectExpression(node.declaration)) {
							node.declaration.properties?.forEach((property) => {
								if (t.isProperty(property) && t.isIdentifier(property.key)) {
									addTag(property.key.name);
								}
							});
						} else if (t.isExportNamedDeclaration(node) && !node.source) {
							node.specifiers.forEach((specifier) => {
								if (t.isExportSpecifier(specifier) && t.isIdentifier(specifier.exported)) {
									addTag(specifier.local.name);
								}
							});
						}
					}
				},
			},
		},
	};
}
