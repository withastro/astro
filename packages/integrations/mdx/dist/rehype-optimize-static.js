import { SKIP, visit } from 'estree-util-visit';
import { toHtml } from 'hast-util-to-html';
const exportConstComponentsRe = /export\s+const\s+components\s*=/;
const rehypeOptimizeStatic = (options) => {
	return (tree) => {
		const ignoreElementNames = new Set(options?.ignoreElementNames);
		for (const child of tree.children) {
			if (child.type === 'mdxjsEsm' && exportConstComponentsRe.test(child.value)) {
				const keys = getExportConstComponentObjectKeys(child);
				if (keys) {
					for (const key of keys) {
						ignoreElementNames.add(key);
					}
				}
				break;
			}
		}
		const allPossibleElements = /* @__PURE__ */ new Set();
		const elementStack = [];
		const elementMetadatas = /* @__PURE__ */ new WeakMap();
		const isNodeNonStatic = (node) => {
			return (
				node.type.startsWith('mdx') || // @ts-expect-error `node` should never have `type: 'root'`, but in some cases plugins may inject it as children,
				// which MDX will render as a fragment instead (an MDX fragment is a `mdxJsxFlowElement` type).
				node.type === 'root' || // @ts-expect-error Access `.tagName` naively for perf
				ignoreElementNames.has(node.tagName)
			);
		};
		visit(tree, {
			// @ts-expect-error Force coerce node as hast node
			enter(node, key, index, parents) {
				if (key != null && key !== 'children') return SKIP;
				simplifyPlainMdxComponentNode(node, ignoreElementNames);
				if (isNodeNonStatic(node)) {
					for (const el of elementStack) {
						allPossibleElements.delete(el);
					}
					elementStack.length = 0;
				}
				if (node.type === 'element' || isMdxComponentNode(node)) {
					elementStack.push(node);
					allPossibleElements.add(node);
					if (index != null && node.type === 'element') {
						elementMetadatas.set(node, { parent: parents[parents.length - 1], index });
					}
				}
			},
			// @ts-expect-error Force coerce node as hast node
			leave(node, key, _, parents) {
				if (key != null && key !== 'children') return SKIP;
				if (node.type === 'element' || isMdxComponentNode(node)) {
					elementStack.pop();
					const parent = parents[parents.length - 1];
					if (allPossibleElements.has(parent)) {
						allPossibleElements.delete(node);
					}
				}
			},
		});
		const elementGroups = findElementGroups(allPossibleElements, elementMetadatas, isNodeNonStatic);
		for (const el of allPossibleElements) {
			if (el.children.length === 0) continue;
			if (isMdxComponentNode(el)) {
				el.attributes.push({
					type: 'mdxJsxAttribute',
					name: 'set:html',
					value: toHtml(el.children),
				});
			} else {
				el.properties['set:html'] = toHtml(el.children);
			}
			el.children = [];
		}
		for (let i = elementGroups.length - 1; i >= 0; i--) {
			const group = elementGroups[i];
			const fragmentNode = {
				type: 'mdxJsxFlowElement',
				name: 'Fragment',
				attributes: [
					{
						type: 'mdxJsxAttribute',
						name: 'set:html',
						value: toHtml(group.children),
					},
				],
				children: [],
			};
			group.parent.children.splice(group.startIndex, group.children.length, fragmentNode);
		}
	};
};
function findElementGroups(allPossibleElements, elementMetadatas, isNodeNonStatic) {
	const elementGroups = [];
	for (const el of allPossibleElements) {
		if (isNodeNonStatic(el)) continue;
		const metadata = elementMetadatas.get(el);
		if (!metadata) {
			throw new Error(
				'Internal MDX error: rehype-optimize-static should have metadata for element node',
			);
		}
		const groupableElements = [el];
		for (let i = metadata.index + 1; i < metadata.parent.children.length; i++) {
			const node = metadata.parent.children[i];
			if (isNodeNonStatic(node)) break;
			if (node.type === 'element') {
				const existed = allPossibleElements.delete(node);
				if (!existed) break;
			}
			groupableElements.push(node);
		}
		if (groupableElements.length > 1) {
			elementGroups.push({
				parent: metadata.parent,
				startIndex: metadata.index,
				children: groupableElements,
			});
			allPossibleElements.delete(el);
		}
	}
	return elementGroups;
}
function isMdxComponentNode(node) {
	return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}
function getExportConstComponentObjectKeys(node) {
	let variableInit;
	for (const part of node.data?.estree?.body || []) {
		if (
			part.type !== 'ExportNamedDeclaration' ||
			part.declaration?.type !== 'VariableDeclaration'
		) {
			continue;
		}
		const declarator = part.declaration.declarations.find(({ id }) => id.name === 'components');
		if (declarator) {
			variableInit = declarator.init;
			break;
		}
	}
	if (variableInit?.type !== 'ObjectExpression') return;
	const keys = [];
	for (const propertyNode of variableInit.properties) {
		if (propertyNode.type === 'Property' && propertyNode.key.type === 'Identifier') {
			keys.push(propertyNode.key.name);
		}
	}
	return keys;
}
function simplifyPlainMdxComponentNode(node, ignoreElementNames) {
	if (
		!isMdxComponentNode(node) || // Attributes could be dynamic, so bail if so.
		node.attributes.length > 0 || // Fragments are also dynamic
		!node.name || // Ignore if the node name is in the ignore list
		ignoreElementNames.has(node.name) || // If the node name has uppercase characters, it's likely an actual MDX component
		node.name.toLowerCase() !== node.name
	) {
		return;
	}
	const newNode = node;
	newNode.type = 'element';
	newNode.tagName = node.name;
	newNode.properties = {};
	node.attributes = void 0;
	node.data = void 0;
}
export { rehypeOptimizeStatic };
