import type { PluginObj } from '@babel/core';
import * as t from '@babel/types';

function isComponent(tagName: string) {
	return (
		(tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
		tagName.includes('.') ||
		/[^a-zA-Z]/.test(tagName[0])
	);
}

function hasClientDirective(node: t.JSXElement) {
	for (const attr of node.openingElement.attributes) {
		if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXNamespacedName') {
			return attr.name.namespace.name === 'client';
		}
	}
	return false;
}

function getTagName(tag: t.JSXElement) {
	const jsxName = tag.openingElement.name;
	return jsxElementNameToString(jsxName);
}

function jsxElementNameToString(node: t.JSXOpeningElement['name']): string {
	if (t.isJSXMemberExpression(node)) {
		return `${jsxElementNameToString(node.object)}.${node.property.name}`;
	}
	if (t.isJSXIdentifier(node) || t.isIdentifier(node)) {
		return node.name;
	}
	return `${node.namespace.name}:${node.name.name}`;
}

function jsxAttributeToString(attr: t.JSXAttribute): string {
	if (t.isJSXNamespacedName(attr.name)) {
		return `${attr.name.namespace.name}:${attr.name.name.name}`;
	}
	return `${attr.name.name}`;
}

function addClientMetadata(node: t.JSXElement, meta: { path: string; name: string }) {
	const existingAttributes = node.openingElement.attributes.map((attr) =>
		t.isJSXAttribute(attr) ? jsxAttributeToString(attr) : null
	);
	if (!existingAttributes.find((attr) => attr === 'client:component-path')) {
		const componentPath = t.jsxAttribute(
			t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-path')),
			!meta.path.startsWith('.')
				? t.stringLiteral(meta.path)
				: t.jsxExpressionContainer(
						t.binaryExpression(
							'+',
							t.stringLiteral('/@fs'),
							t.memberExpression(
								t.newExpression(t.identifier('URL'), [
									t.stringLiteral(meta.path),
									t.identifier('import.meta.url'),
								]),
								t.identifier('pathname')
							)
						)
				  )
		);
		node.openingElement.attributes.push(componentPath);
	}
	if (!existingAttributes.find((attr) => attr === 'client:component-export')) {
		if (meta.name === '*') {
			meta.name = getTagName(node).split('.').at(1)!;
		}
		const componentExport = t.jsxAttribute(
			t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-export')),
			t.stringLiteral(meta.name)
		);
		node.openingElement.attributes.push(componentExport);
	}
	if (!existingAttributes.find((attr) => attr === 'client:component-hydration')) {
		const staticMarker = t.jsxAttribute(
			t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-hydration'))
		);
		node.openingElement.attributes.push(staticMarker);
	}
}

export default function astroJSX(): PluginObj {
	return {
		visitor: {
			Program(path) {
				path.node.body.splice(
					0,
					0,
					t.importDeclaration(
						[t.importSpecifier(t.identifier('Fragment'), t.identifier('Fragment'))],
						t.stringLiteral('astro/jsx-runtime')
					)
				);
			},
			ImportDeclaration(path, state) {
				const source = path.node.source.value;
				if (source.startsWith('astro/jsx-runtime')) return;
				const specs = path.node.specifiers.map((spec) => {
					if (t.isImportDefaultSpecifier(spec))
						return { local: spec.local.name, imported: 'default' };
					if (t.isImportNamespaceSpecifier(spec)) return { local: spec.local.name, imported: '*' };
					if (t.isIdentifier(spec.imported))
						return { local: spec.local.name, imported: spec.imported.name };
					return { local: spec.local.name, imported: spec.imported.value };
				});
				const imports = state.get('imports') ?? new Map();
				for (const spec of specs) {
					if (imports.has(source)) {
						const existing = imports.get(source);
						existing.add(spec);
						imports.set(source, existing);
					} else {
						imports.set(source, new Set([spec]));
					}
				}
				state.set('imports', imports);
			},
			JSXIdentifier(path, state) {
				const isAttr = path.findParent((n) => t.isJSXAttribute(n));
				if (isAttr) return;
				const parent = path.findParent((n) => t.isJSXElement(n))!;
				const parentNode = parent.node as t.JSXElement;
				const tagName = getTagName(parentNode);
				if (!isComponent(tagName)) return;
				if (!hasClientDirective(parentNode)) return;

				const imports = state.get('imports') ?? new Map();
				const namespace = getTagName(parentNode).split('.');
				for (const [source, specs] of imports) {
					for (const { imported, local } of specs) {
						const reference = path.referencesImport(source, imported);
						if (reference) {
							path.setData('import', { name: imported, path: source });
							break;
						}
						if (namespace.at(0) === local) {
							path.setData('import', { name: imported, path: source });
							break;
						}
					}
				}
				// TODO: map unmatched identifiers back to imports if possible
				const meta = path.getData('import');
				if (meta) {
					addClientMetadata(parentNode, meta);
				} else {
					throw new Error(
						`Unable to match <${getTagName(
							parentNode
						)}> with client:* directive to an import statement!`
					);
				}
			},
		},
	};
}
