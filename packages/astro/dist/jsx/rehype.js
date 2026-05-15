import { visit } from 'unist-util-visit';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import { resolvePath } from '../core/viteUtils.js';
import { createDefaultAstroMetadata } from '../vite-plugin-astro/metadata.js';
const ClientOnlyPlaceholder = 'astro-client-only';
const rehypeAnalyzeAstroMetadata = () => {
	return (tree, file) => {
		const metadata = createDefaultAstroMetadata();
		const imports = parseImports(tree.children);
		visit(tree, (node) => {
			if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;
			const tagName = node.name;
			if (
				!tagName ||
				!isComponent(tagName) ||
				!(hasClientDirective(node) || hasServerDeferDirective(node))
			)
				return;
			const matchedImport = findMatchingImport(tagName, imports);
			if (!matchedImport) {
				throw new AstroError({
					...AstroErrorData.NoMatchingImport,
					message: AstroErrorData.NoMatchingImport.message(node.name),
				});
			}
			if (matchedImport.path.endsWith('.astro')) {
				const clientAttribute = node.attributes.find(
					(attr) => attr.type === 'mdxJsxAttribute' && attr.name.startsWith('client:'),
				);
				if (clientAttribute) {
					console.warn(
						`You are attempting to render <${node.name} ${clientAttribute.name} />, but ${node.name} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`,
					);
				}
			}
			const resolvedPath = resolvePath(matchedImport.path, file.path);
			if (hasClientOnlyDirective(node)) {
				metadata.clientOnlyComponents.push({
					exportName: matchedImport.name,
					localName: '',
					specifier: tagName,
					resolvedPath,
				});
				addClientOnlyMetadata(node, matchedImport, resolvedPath);
			} else if (hasClientDirective(node)) {
				metadata.hydratedComponents.push({
					exportName: '*',
					localName: '',
					specifier: tagName,
					resolvedPath,
				});
				addClientMetadata(node, matchedImport, resolvedPath);
			} else if (hasServerDeferDirective(node)) {
				metadata.serverComponents.push({
					exportName: matchedImport.name,
					localName: tagName,
					specifier: matchedImport.path,
					resolvedPath,
				});
				addServerDeferMetadata(node, matchedImport, resolvedPath);
			}
		});
		file.data.__astroMetadata = metadata;
	};
};
function getAstroMetadata(file) {
	return file.data.__astroMetadata;
}
function parseImports(children) {
	const imports = /* @__PURE__ */ new Map();
	for (const child of children) {
		if (child.type !== 'mdxjsEsm') continue;
		const body = child.data?.estree?.body;
		if (!body) continue;
		for (const ast of body) {
			if (ast.type !== 'ImportDeclaration') continue;
			const source = ast.source.value;
			const specs = ast.specifiers.map((spec) => {
				switch (spec.type) {
					case 'ImportDefaultSpecifier':
						return { local: spec.local.name, imported: 'default' };
					case 'ImportNamespaceSpecifier':
						return { local: spec.local.name, imported: '*' };
					case 'ImportSpecifier': {
						return {
							local: spec.local.name,
							imported:
								spec.imported.type === 'Identifier'
									? spec.imported.name
									: String(spec.imported.value),
						};
					}
					default:
						throw new Error('Unknown import declaration specifier: ' + spec);
				}
			});
			let specSet = imports.get(source);
			if (!specSet) {
				specSet = /* @__PURE__ */ new Set();
				imports.set(source, specSet);
			}
			for (const spec of specs) {
				specSet.add(spec);
			}
		}
	}
	return imports;
}
function isComponent(tagName) {
	return (
		(tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
		tagName.includes('.') ||
		/[^a-zA-Z]/.test(tagName[0])
	);
}
function hasClientDirective(node) {
	return node.attributes.some(
		(attr) => attr.type === 'mdxJsxAttribute' && attr.name.startsWith('client:'),
	);
}
function hasServerDeferDirective(node) {
	return node.attributes.some(
		(attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'server:defer',
	);
}
function hasClientOnlyDirective(node) {
	return node.attributes.some(
		(attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'client:only',
	);
}
function findMatchingImport(tagName, imports) {
	const tagSpecifier = tagName.split('.')[0];
	for (const [source, specs] of imports) {
		for (const { imported, local } of specs) {
			if (local === tagSpecifier) {
				if (tagSpecifier !== tagName) {
					switch (imported) {
						// Namespace import: "<buttons.Foo.Bar />" => name: "Foo.Bar"
						case '*': {
							const accessPath = tagName.slice(tagSpecifier.length + 1);
							return { name: accessPath, path: source };
						}
						// Default import: "<buttons.Foo.Bar />" => name: "default.Foo.Bar"
						case 'default': {
							const accessPath = tagName.slice(tagSpecifier.length + 1);
							return { name: `default.${accessPath}`, path: source };
						}
						// Named import: "<buttons.Foo.Bar />" => name: "buttons.Foo.Bar"
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
function addClientMetadata(node, meta, resolvedPath) {
	const attributeNames = node.attributes
		.map((attr) => (attr.type === 'mdxJsxAttribute' ? attr.name : null))
		.filter(Boolean);
	if (!attributeNames.includes('client:component-path')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:component-path',
			value: resolvedPath,
		});
	}
	if (!attributeNames.includes('client:component-export')) {
		if (meta.name === '*') {
			meta.name = node.name.split('.').slice(1).join('.');
		}
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:component-export',
			value: meta.name,
		});
	}
	if (!attributeNames.includes('client:component-hydration')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:component-hydration',
			value: null,
		});
	}
}
function addClientOnlyMetadata(node, meta, resolvedPath) {
	const attributeNames = node.attributes
		.map((attr) => (attr.type === 'mdxJsxAttribute' ? attr.name : null))
		.filter(Boolean);
	if (!attributeNames.includes('client:display-name')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:display-name',
			value: node.name,
		});
	}
	if (!attributeNames.includes('client:component-path')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:component-path',
			value: resolvedPath,
		});
	}
	if (!attributeNames.includes('client:component-export')) {
		if (meta.name === '*') {
			meta.name = node.name.split('.').slice(1).join('.');
		}
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:component-export',
			value: meta.name,
		});
	}
	if (!attributeNames.includes('client:component-hydration')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:component-hydration',
			value: null,
		});
	}
	node.name = ClientOnlyPlaceholder;
}
function addServerDeferMetadata(node, meta, resolvedPath) {
	const attributeNames = node.attributes
		.map((attr) => (attr.type === 'mdxJsxAttribute' ? attr.name : null))
		.filter(Boolean);
	if (!attributeNames.includes('server:component-directive')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'server:component-directive',
			value: 'server:defer',
		});
	}
	if (!attributeNames.includes('server:component-path')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'server:component-path',
			value: resolvedPath,
		});
	}
	if (!attributeNames.includes('server:component-export')) {
		if (meta.name === '*') {
			meta.name = node.name.split('.').slice(1).join('.');
		}
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'server:component-export',
			value: meta.name,
		});
	}
}
export { getAstroMetadata, rehypeAnalyzeAstroMetadata };
