import type { PluginObj } from '@babel/core';
import * as Babel from '@babel/types';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import { resolvePath } from '../core/util.js';
import type { PluginMetadata } from '../vite-plugin-astro/types';

const t = await import('@babel/types')
			.catch(error => new Proxy({}, { get: () => {
				if (process.version.startsWith('v20.6')) {
					console.error("The build could not complete because of a bug in Node.js v20.6.0.\nSee https://github.com/nodejs/node/issues/49497\n\nConsider using Node.js v20.5.1, or update if the issue has been fixed.")
					process.exit(1)
				}
				else { throw error }
			} }) as never);

const ClientOnlyPlaceholder = 'astro-client-only';

function isComponent(tagName: string) {
	return (
		(tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
		tagName.includes('.') ||
		/[^a-zA-Z]/.test(tagName[0])
	);
}

function hasClientDirective(node: Babel.JSXElement) {
	for (const attr of node.openingElement.attributes) {
		if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXNamespacedName') {
			return attr.name.namespace.name === 'client';
		}
	}
	return false;
}

function isClientOnlyComponent(node: Babel.JSXElement) {
	for (const attr of node.openingElement.attributes) {
		if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXNamespacedName') {
			return jsxAttributeToString(attr) === 'client:only';
		}
	}
	return false;
}

function getTagName(tag: Babel.JSXElement) {
	const jsxName = tag.openingElement.name;
	return jsxElementNameToString(jsxName);
}

function jsxElementNameToString(node: Babel.JSXOpeningElement['name']): string {
	if (t.isJSXMemberExpression(node)) {
		return `${jsxElementNameToString(node.object)}.${node.property.name}`;
	}
	if (t.isJSXIdentifier(node) || t.isIdentifier(node)) {
		return node.name;
	}
	return `${node.namespace.name}:${node.name.name}`;
}

function jsxAttributeToString(attr: Babel.JSXAttribute): string {
	if (t.isJSXNamespacedName(attr.name)) {
		return `${attr.name.namespace.name}:${attr.name.name.name}`;
	}
	return `${attr.name.name}`;
}

function addClientMetadata(
	node: Babel.JSXElement,
	meta: { resolvedPath: string; path: string; name: string }
) {
	const existingAttributes = node.openingElement.attributes.map((attr) =>
		t.isJSXAttribute(attr) ? jsxAttributeToString(attr) : null
	);
	if (!existingAttributes.find((attr) => attr === 'client:component-path')) {
		const componentPath = t.jsxAttribute(
			t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-path')),
			t.stringLiteral(meta.resolvedPath)
		);
		node.openingElement.attributes.push(componentPath);
	}
	if (!existingAttributes.find((attr) => attr === 'client:component-export')) {
		if (meta.name === '*') {
			meta.name = getTagName(node).split('.').slice(1).join('.')!;
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

function addClientOnlyMetadata(
	node: Babel.JSXElement,
	meta: { resolvedPath: string; path: string; name: string }
) {
	const tagName = getTagName(node);
	node.openingElement = t.jsxOpeningElement(
		t.jsxIdentifier(ClientOnlyPlaceholder),
		node.openingElement.attributes
	);
	if (node.closingElement) {
		node.closingElement = t.jsxClosingElement(t.jsxIdentifier(ClientOnlyPlaceholder));
	}
	const existingAttributes = node.openingElement.attributes.map((attr) =>
		t.isJSXAttribute(attr) ? jsxAttributeToString(attr) : null
	);
	if (!existingAttributes.find((attr) => attr === 'client:display-name')) {
		const displayName = t.jsxAttribute(
			t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('display-name')),
			t.stringLiteral(tagName)
		);
		node.openingElement.attributes.push(displayName);
	}
	if (!existingAttributes.find((attr) => attr === 'client:component-path')) {
		const componentPath = t.jsxAttribute(
			t.jsxNamespacedName(t.jsxIdentifier('client'), t.jsxIdentifier('component-path')),
			t.stringLiteral(meta.resolvedPath)
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
			Program: {
				enter(path, state) {
					if (!(state.file.metadata as PluginMetadata).astro) {
						(state.file.metadata as PluginMetadata).astro = {
							clientOnlyComponents: [],
							hydratedComponents: [],
							scripts: [],
							containsHead: false,
							propagation: 'none',
							pageOptions: {},
						};
					}
					path.node.body.splice(
						0,
						0,
						t.importDeclaration(
							[t.importSpecifier(t.identifier('Fragment'), t.identifier('Fragment'))],
							t.stringLiteral('astro/jsx-runtime')
						)
					);
				},
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
			JSXMemberExpression(path, state) {
				const node = path.node;
				// Skip automatic `_components` in MDX files
				if (
					state.filename?.endsWith('.mdx') &&
					t.isJSXIdentifier(node.object) &&
					node.object.name === '_components'
				) {
					return;
				}
				const parent = path.findParent((n) => t.isJSXElement(n.node))!;
				const parentNode = parent.node as Babel.JSXElement;
				const tagName = getTagName(parentNode);
				if (!isComponent(tagName)) return;
				if (!hasClientDirective(parentNode)) return;
				const isClientOnly = isClientOnlyComponent(parentNode);
				if (tagName === ClientOnlyPlaceholder) return;

				const imports = state.get('imports') ?? new Map();
				const namespace = tagName.split('.');
				for (const [source, specs] of imports) {
					for (const { imported, local } of specs) {
						const reference = path.referencesImport(source, imported);
						if (reference) {
							path.setData('import', { name: imported, path: source });
							break;
						}
						if (namespace.at(0) === local) {
							const name = imported === '*' ? imported : tagName;
							path.setData('import', { name, path: source });
							break;
						}
					}
				}

				const meta = path.getData('import');
				if (meta) {
					const resolvedPath = resolvePath(meta.path, state.filename!);

					if (isClientOnly) {
						(state.file.metadata as PluginMetadata).astro.clientOnlyComponents.push({
							exportName: meta.name,
							specifier: tagName,
							resolvedPath,
						});

						meta.resolvedPath = resolvedPath;
						addClientOnlyMetadata(parentNode, meta);
					} else {
						(state.file.metadata as PluginMetadata).astro.hydratedComponents.push({
							exportName: '*',
							specifier: tagName,
							resolvedPath,
						});

						meta.resolvedPath = resolvedPath;
						addClientMetadata(parentNode, meta);
					}
				} else {
					throw new Error(
						`Unable to match <${getTagName(
							parentNode
						)}> with client:* directive to an import statement!`
					);
				}
			},
			JSXIdentifier(path, state) {
				const isAttr = path.findParent((n) => t.isJSXAttribute(n.node));
				if (isAttr) return;
				const parent = path.findParent((n) => t.isJSXElement(n.node))!;
				const parentNode = parent.node as Babel.JSXElement;
				const tagName = getTagName(parentNode);
				if (!isComponent(tagName)) return;
				if (!hasClientDirective(parentNode)) return;
				const isClientOnly = isClientOnlyComponent(parentNode);
				if (tagName === ClientOnlyPlaceholder) return;

				const imports = state.get('imports') ?? new Map();
				const namespace = tagName.split('.');
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

				const meta = path.getData('import');
				if (meta) {
					// If JSX is importing an Astro component, e.g. using MDX for templating,
					// check Astro node's props and make sure they are valid for an Astro component
					if (meta.path.endsWith('.astro')) {
						const displayName = getTagName(parentNode);
						for (const attr of parentNode.openingElement.attributes) {
							if (t.isJSXAttribute(attr)) {
								const name = jsxAttributeToString(attr);
								if (name.startsWith('client:')) {
									// eslint-disable-next-line
									console.warn(
										`You are attempting to render <${displayName} ${name} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
									);
								}
							}
						}
					}
					const resolvedPath = resolvePath(meta.path, state.filename!);
					if (isClientOnly) {
						(state.file.metadata as PluginMetadata).astro.clientOnlyComponents.push({
							exportName: meta.name,
							specifier: meta.name,
							resolvedPath,
						});

						meta.resolvedPath = resolvedPath;
						addClientOnlyMetadata(parentNode, meta);
					} else {
						(state.file.metadata as PluginMetadata).astro.hydratedComponents.push({
							exportName: meta.name,
							specifier: meta.name,
							resolvedPath,
						});

						meta.resolvedPath = resolvedPath;
						addClientMetadata(parentNode, meta);
					}
				} else {
					throw new AstroError({
						...AstroErrorData.NoMatchingImport,
						message: AstroErrorData.NoMatchingImport.message(getTagName(parentNode)),
					});
				}
			},
		},
	};
}
