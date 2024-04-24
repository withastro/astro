import type { RehypePlugin } from '@astrojs/markdown-remark';
import type { RootContent } from 'hast';
import type { MdxJsxFlowElementHast, MdxJsxTextElementHast } from 'mdast-util-mdx-jsx';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';
import { resolvePath } from '../core/util.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';

// This import includes ambient types for hast to include mdx nodes
import type {} from 'mdast-util-mdx';

const ClientOnlyPlaceholder = 'astro-client-only';

export const rehypeAnalyzeAstroMetadata: RehypePlugin = () => {
	return (tree, file) => {
		// Initial metadata for this MDX file, it will be mutated as we traverse the tree
		const metadata: PluginMetadata['astro'] = {
			clientOnlyComponents: [],
			hydratedComponents: [],
			scripts: [],
			containsHead: false,
			propagation: 'none',
			pageOptions: {},
		};

		// Parse imports in this file. This is used to match components with their import source
		const imports = parseImports(tree.children);

		visit(tree, (node) => {
			if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;

			const tagName = node.name;
			if (!tagName || !isComponent(tagName) || !hasClientDirective(node)) return;

			// From this point onwards, `node` is confirmed to be an island component

			// Match this component with its import source
			const matchedImport = findMatchingImport(tagName, imports);
			if (!matchedImport) {
				throw new AstroError({
					...AstroErrorData.NoMatchingImport,
					message: AstroErrorData.NoMatchingImport.message(node.name!),
				});
			}

			const resolvedPath = resolvePath(matchedImport.path, file.path);

			if (hasClientOnlyDirective(node)) {
				// Add this component to the metadata
				metadata.clientOnlyComponents.push({
					exportName: matchedImport.name,
					specifier: tagName,
					resolvedPath,
				});
				// Mutate node with additional island attributes
				addClientOnlyMetadata(node, matchedImport, resolvedPath);
			} else {
				// Add this component to the metadata
				metadata.hydratedComponents.push({
					exportName: '*',
					specifier: tagName,
					resolvedPath,
				});
				// Mutate node with additional island attributes
				addClientMetadata(node, matchedImport, resolvedPath);
			}
		});

		file.data.__astroMetadata = metadata;
	};
};

export function getAstroMetadata(file: VFile) {
	return file.data.__astroMetadata as PluginMetadata['astro'] | undefined;
}

type ImportSpecifier = { local: string; imported: string };

function parseImports(children: RootContent[]) {
	// Map of import source to its imported specifiers
	const imports = new Map<string, Set<ImportSpecifier>>();

	for (const child of children) {
		if (child.type !== 'mdxjsEsm') continue;

		const body = child.data?.estree?.body;
		if (!body) continue;

		for (const ast of body) {
			if (ast.type !== 'ImportDeclaration') continue;

			const source = ast.source.value as string;
			const specs: ImportSpecifier[] = ast.specifiers.map((spec) => {
				switch (spec.type) {
					case 'ImportDefaultSpecifier':
						return { local: spec.local.name, imported: 'default' };
					case 'ImportNamespaceSpecifier':
						return { local: spec.local.name, imported: '*' };
					case 'ImportSpecifier':
						return { local: spec.local.name, imported: spec.imported.name };
					default:
						throw new Error('Unknown import declaration specifier: ' + spec);
				}
			});

			// Get specifiers set from source or initialize a new one
			let specSet = imports.get(source);
			if (!specSet) {
				specSet = new Set();
				imports.set(source, specSet);
			}

			for (const spec of specs) {
				specSet.add(spec);
			}
		}
	}

	return imports;
}

function isComponent(tagName: string) {
	return (
		(tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
		tagName.includes('.') ||
		/[^a-zA-Z]/.test(tagName[0])
	);
}

function hasClientDirective(node: MdxJsxFlowElementHast | MdxJsxTextElementHast) {
	return node.attributes.some(
		(attr) => attr.type === 'mdxJsxAttribute' && attr.name.startsWith('client:')
	);
}

function hasClientOnlyDirective(node: MdxJsxFlowElementHast | MdxJsxTextElementHast) {
	return node.attributes.some(
		(attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'client:only'
	);
}

type MatchedImport = { name: string; path: string };

function findMatchingImport(
	tagName: string,
	imports: Map<string, Set<ImportSpecifier>>
): MatchedImport | undefined {
	const tagSpecifier = tagName.split('.')[0];
	for (const [source, specs] of imports) {
		for (const { imported, local } of specs) {
			if (local === tagSpecifier) {
				return { name: imported === '*' ? imported : tagName, path: source };
			}
		}
	}
}

function addClientMetadata(
	node: MdxJsxFlowElementHast | MdxJsxTextElementHast,
	meta: MatchedImport,
	resolvedPath: string
) {
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
			meta.name = node.name!.split('.').slice(1).join('.')!;
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

function addClientOnlyMetadata(
	node: MdxJsxFlowElementHast | MdxJsxTextElementHast,
	meta: { path: string; name: string },
	resolvedPath: string
) {
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
	if (!attributeNames.includes('client:component-hydpathation')) {
		node.attributes.push({
			type: 'mdxJsxAttribute',
			name: 'client:component-path',
			value: resolvedPath,
		});
	}
	if (!attributeNames.includes('client:component-export')) {
		if (meta.name === '*') {
			meta.name = node.name!.split('.').slice(1).join('.')!;
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
