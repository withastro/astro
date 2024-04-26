import { visit, SKIP } from 'estree-util-visit';
import { toHtml } from 'hast-util-to-html';

// accessing untyped hast and mdx types
type Node = any;

export interface OptimizeOptions {
	ignoreComponentNames?: string[];
}

interface ElementMetadata {
	parent: Node;
	index: number;
}

const exportConstComponentsRe = /export\s+const\s+components\s*=/;

/**
 * For MDX only, collapse static subtrees of the hast into `set:html`. Subtrees
 * do not include any MDX elements.
 *
 * This optimization reduces the JS output as more content are represented as a
 * string instead, which also reduces the AST size that Rollup holds in memory.
 */
export function rehypeOptimizeStatic(options?: OptimizeOptions) {
	return (tree: any) => {
		// A set of non-static components to avoid collapsing when walking the tree
		// as they need to be preserved as JSX to be rendered dynamically.
		const ignoreComponentNames = new Set<string>(options?.ignoreComponentNames);

		// Find `export const components = { ... }` and get it's object's keys to be
		// populated into `ignoreComponentNames`. This configuration is used to render
		// some HTML elements as custom components, and we also want to avoid collapsing them.
		for (const child of tree.children) {
			if (child.type === 'mdxjsEsm' && exportConstComponentsRe.test(child.value)) {
				// Try to loosely get the object property nodes
				const objectPropertyNodes =
					child.data.estree?.body[0]?.declaration?.declarations?.[0]?.init?.properties;
				if (objectPropertyNodes) {
					for (const objectPropertyNode of objectPropertyNodes) {
						const componentName = objectPropertyNode.key?.name;
						if (componentName) {
							ignoreComponentNames.add(componentName);
						}
					}
				}
			}
		}

		// All possible elements that could be the root of a subtree
		const allPossibleElements = new Set<Node>();
		// The current collapsible element stack while traversing the tree
		const elementStack: Node[] = [];
		// Metadata used by `findElementGroups` later
		const elementMetadatas = new WeakMap<Node, ElementMetadata>();

		const isNodeNonStatic = (node: Node) => {
			return node.type.startsWith('mdx') || ignoreComponentNames.has(node.tagName);
		};

		visit(tree, {
			enter(node, key, index, parents) {
				// `estree-util-visit` may traverse in MDX `attributes`, we don't want that. Only continue
				// if it's traversing the root, or the `children` key.
				if (key != null && key !== 'children') return SKIP;

				// For nodes that are not static, eliminate all elements in the `elementStack` from the
				// `allPossibleElements` set.
				if (isNodeNonStatic(node)) {
					for (const el of elementStack) {
						allPossibleElements.delete(el);
					}
					// Micro-optimization: While this destroys the meaning of an element
					// stack for this node, things will still work but we won't repeatedly
					// run the above for other nodes anymore. If this is confusing, you can
					// comment out the code below when reading.
					elementStack.length = 0;
				}
				// For possible subtree root nodes, record them in `elementStack` and
				// `allPossibleElements` to be used in the "leave" hook below.
				// @ts-expect-error MDX types for `.type` is not enhanced because MDX isn't used directly
				if (node.type === 'element' || isMdxComponentNode(node)) {
					elementStack.push(node);
					allPossibleElements.add(node);

					// @ts-expect-error MDX types for `.type` is not enhanced because MDX isn't used directly
					if (index != null && node.type === 'element') {
						// Record metadata for element node to be used for grouping analysis later
						elementMetadatas.set(node, { parent: parents[parents.length - 1], index });
					}
				}
			},
			leave(node, key, _, parents) {
				// `estree-util-visit` may traverse in MDX `attributes`, we don't want that. Only continue
				// if it's traversing the root, or the `children` key.
				if (key != null && key !== 'children') return SKIP;

				// Do the reverse of the if condition above, popping the `elementStack`,
				// and consolidating `allPossibleElements` as a subtree root.
				// @ts-expect-error MDX types for `.type` is not enhanced because MDX isn't used directly
				if (node.type === 'element' || isMdxComponentNode(node)) {
					elementStack.pop();
					// Many possible elements could be part of a subtree, in order to find
					// the root, we check the parent of the element we're popping. If the
					// parent exists in `allPossibleElements`, then we're definitely not
					// the root, so remove ourselves. This will work retroactively as we
					// climb back up the tree.
					const parent = parents[parents.length - 1];
					if (allPossibleElements.has(parent)) {
						allPossibleElements.delete(node);
					}
				}
			},
		});

		// Within `allPossibleElements`, element nodes are often siblings and instead of setting `set:html`
		// on each of the element node, we can create a `<Fragment set:html="...">` element that includes
		// all element nodes instead, simplifying the output.
		const elementGroups = findElementGroups(allPossibleElements, elementMetadatas, isNodeNonStatic);

		// For all possible subtree roots, collapse them into `set:html` and
		// strip of their children
		for (const el of allPossibleElements) {
			// Avoid adding empty `set:html` attributes if there's no children
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

		// For each element group, we create a new `<Fragment />` MDX node with `set:html` of the children
		// serialized as HTML. We insert this new fragment, replacing all the group children nodes.
		// We iterate in reverse to avoid changing the index of groups of the same parent.
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
}

interface ElementGroup {
	parent: Node;
	startIndex: number;
	children: Node[];
}

/**
 * Iterate through `allPossibleElements` and find elements that are siblings, and return them. `allPossibleElements`
 * will be mutated to exclude these grouped elements.
 */
function findElementGroups(
	allPossibleElements: Set<Node>,
	elementMetadatas: WeakMap<Node, ElementMetadata>,
	isNodeNonStatic: (node: Node) => boolean
): ElementGroup[] {
	const elementGroups: ElementGroup[] = [];

	for (const el of allPossibleElements) {
		// Non-static nodes can't be grouped. It can only optimize its static children.
		if (isNodeNonStatic(el)) continue;

		// Get the metadata for the element node, this should always exist
		const metadata = elementMetadatas.get(el);
		if (!metadata) {
			throw new Error(
				'Internal MDX error: rehype-optimize-static should have metadata for element node'
			);
		}

		// For this element, iterate through the next siblings and add them to this array
		// if they are text nodes or elements that are in `allPossibleElements` (optimizable).
		// If one of the next siblings don't match the criteria, break the loop as others are no longer siblings.
		const groupableElements = [el];
		for (let i = metadata.index + 1; i < metadata.parent.children.length; i++) {
			const node = metadata.parent.children[i];

			// If the node is non-static, we can't group it with the current element
			if (isNodeNonStatic(node)) break;

			if (node.type === 'element') {
				// This node is now (persumably) part of a group, remove it from `allPossibleElements`
				const existed = allPossibleElements.delete(node);
				// If this node didn't exist in `allPossibleElements`, it's likely that one of its children
				// are non-static, hence this node can also not be grouped. So we break out here.
				if (!existed) break;
			}

			groupableElements.push(node);
		}

		// If group elements are more than one, add them to the `elementGroups`.
		// Grouping is most effective if there's multiple elements in it.
		if (groupableElements.length > 1) {
			elementGroups.push({
				parent: metadata.parent,
				startIndex: metadata.index,
				children: groupableElements,
			});
			// The `el` is also now part of a group, remove it from `allPossibleElements`
			allPossibleElements.delete(el);
		}
	}

	return elementGroups;
}

function isMdxComponentNode(node: any) {
	return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}
