import type { PluginObj } from '@babel/core';
import * as t from '@babel/types';

export default function astroJSX({ rendererName }: { rendererName: string }): PluginObj {
	return {
		visitor: {
			Program: {
				enter(path) {
					path.node.body.splice(
						0,
						0,
						t.importDeclaration(
							[t.importSpecifier(t.identifier('__astro_tag_component__'), t.identifier('__astro_tag_component__'))],
							t.stringLiteral('astro/server/index.js')
						)
					);
				},
				exit(path, state) {
					const exportedIds  = state.get('astro:tags')
					if (exportedIds) {
						for (const id of exportedIds) {
							path.node.body.push(
								t.expressionStatement(t.callExpression(t.identifier('__astro_tag_component__'), [t.identifier(id), t.stringLiteral(rendererName)]))
							)
						}
					}
				}
			},
			ExportDeclaration(path, state) {
				const node = path.node;
				if (node.exportKind === 'type') return;
				if (node.type === 'ExportAllDeclaration') return;

				if (node.type === 'ExportNamedDeclaration') {
					if (t.isFunctionDeclaration(node.declaration)) {
						if (node.declaration.id?.name) {
							const id = node.declaration.id.name;
							const tags = state.get('astro:tags') ?? []
							state.set('astro:tags', [...tags, id])
						}
					}
				} else if (node.type === 'ExportDefaultDeclaration') {
					if (t.isFunctionDeclaration(node.declaration)) {
						if (node.declaration.id?.name) {
							const id = node.declaration.id.name;
							const tags = state.get('astro:tags') ?? []
							state.set('astro:tags', [...tags, id])
						}
					}
				}
			},
		}
	};
}
