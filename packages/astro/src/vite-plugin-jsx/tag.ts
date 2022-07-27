import type { PluginObj } from '@babel/core';
import * as t from '@babel/types';

/**
 * This plugin handles every file that runs through our JSX plugin.
 * Since we statically match every JSX file to an Astro renderer based on import scanning,
 * it would be helpful to embed some of that metadata at runtime.
 *
 * This plugin crawls each export in the file and "tags" each export with a given `rendererName`.
 * This allows us to automatically match a component to a renderer and skip the usual `check()` calls.
 */
export default function tagExportsWithRenderer({
	rendererName,
}: {
	rendererName: string;
}): PluginObj {
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
							t.stringLiteral('astro/server/index.js')
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
			ExportDeclaration(path, state) {
				const node = path.node;
				if (node.exportKind === 'type') return;
				if (node.type === 'ExportAllDeclaration') return;

				if (node.type === 'ExportNamedDeclaration') {
					if (t.isFunctionDeclaration(node.declaration)) {
						if (node.declaration.id?.name) {
							const id = node.declaration.id.name;
							const tags = state.get('astro:tags') ?? [];
							state.set('astro:tags', [...tags, id]);
						}
					}
				} else if (node.type === 'ExportDefaultDeclaration') {
					if (t.isFunctionDeclaration(node.declaration)) {
						if (node.declaration.id?.name) {
							const id = node.declaration.id.name;
							const tags = state.get('astro:tags') ?? [];
							state.set('astro:tags', [...tags, id]);
						}
					}
				}
			},
		},
	};
}
