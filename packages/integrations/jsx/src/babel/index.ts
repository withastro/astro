import * as t from "@babel/types";
import type { PluginObj, NodePath } from '@babel/core';

function isComponent(tagName: string) {
  return (
    (tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
    tagName.includes(".") ||
    /[^a-zA-Z]/.test(tagName[0])
  );
}

function hasClientDirective(node: t.JSXElement) {
	for (const attr of node.openingElement.attributes) {
		if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXNamespacedName') {
			return attr.name.namespace.name === 'client'
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

function addClientMetadata(node: t.JSXElement, meta: { path: string, name: string }) {
	const componentPath = t.jsxAttribute(
		t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-path')),
		!meta.path.startsWith('.') ? t.stringLiteral(meta.path) : t.jsxExpressionContainer(t.memberExpression(t.newExpression(t.identifier('URL'), [t.stringLiteral(meta.path), t.identifier('import.meta.url')]), t.identifier('pathname'))),
	);
	const componentExport = t.jsxAttribute(
		t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-export')),
		t.stringLiteral(meta.name),
	);
	const staticMarker = t.jsxAttribute(
		t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-hydration')),
	)
	node.openingElement.attributes.push(
		componentPath,
		componentExport,
		staticMarker
	)
}

export default function astroJSX(): PluginObj {
  return {
    visitor: {
			ImportDeclaration(path, state) {
				const source = path.node.source.value;
				if (source.startsWith('@astrojs/jsx')) return;
				const specs = path.node.specifiers.map(spec => {
					if (t.isImportDefaultSpecifier(spec)) return { local: spec.local.name, imported: 'default' }
					if (t.isImportNamespaceSpecifier(spec)) return { local: spec.local.name, imported: '*' }
					if (t.isIdentifier(spec.imported)) return { local: spec.local.name, imported: spec.imported.name };
					return { local: spec.local.name, imported: spec.imported.value };
				});
				const imports = state.get('imports') ?? new Map();
				for (const spec of specs) {
					if (imports.has(source)) {
						const existing = imports.get(source);
						existing.add(spec);
						imports.set(source, existing)
					} else {
						imports.set(source, new Set([spec]))
					}
				}
				state.set('imports', imports);
			},
			JSXIdentifier(path, state) {
				const isAttr = path.findParent(n => t.isJSXAttribute(n));
				if (isAttr) return;
				const parent = path.findParent(n => t.isJSXElement(n))!;
				const parentNode = parent.node as t.JSXElement;
				const tagName = getTagName(parentNode);
				if (!isComponent(tagName)) return;
				if (!hasClientDirective(parentNode)) return;
				
				for (const [source, specs] of state.get('imports')) {
					for (const { imported } of specs) {
						const reference = path.referencesImport(source, imported);
						if (reference) {
							path.setData('import', { name: imported, path: source });
							break;
						}
					}
				}
				// TODO: map unmatched identifiers back to imports if possible
				const meta = path.getData('import');
				if (meta) {
					addClientMetadata(parentNode, meta)
				}
			},
    }
  };
};
