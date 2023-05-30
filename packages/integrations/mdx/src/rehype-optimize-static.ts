import { visit } from 'estree-util-visit';
import { toHtml } from 'hast-util-to-html';

// accessing untyped hast and mdx types
type Node = any;

export interface OptimizeOptions {
	customComponentNames?: string[];
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
		const customComponentNames = new Set<string>(options?.customComponentNames);

		// Find `export const components = { ... }` and get it's object's keys to be
		// populated into `customComponentNames`. This configuration is used to render
		// some HTML elements as custom components, and we also want to avoid collapsing them.
		for (const child of tree.children) {
			if (child.type === 'mdxjsEsm' && exportConstComponentsRe.test(child.value)) {
				// Try to loosely get the object property nodes
				const objectPropertyNodes = child.data.estree.body[0]?.declarations?.[0]?.init?.properties;
				if (objectPropertyNodes) {
					for (const objectPropertyNode of objectPropertyNodes) {
						const componentName = objectPropertyNode.key?.name ?? objectPropertyNode.key?.value;
						if (componentName) {
							customComponentNames.add(componentName);
						}
					}
				}
			}
		}

		// All possible elements that could be the root of a subtree
		const allPossibleElements = new Set<Node>();
		// The current collapsible element stack while traversing the tree
		const elementStack: Node[] = [];

		visit(tree, {
			enter(node) {
				// @ts-expect-error read tagName naively
				const isCustomComponent = node.tagName && customComponentNames.has(node.tagName);
				// For nodes that can't be optimized, eliminate all elements in the
				// `elementStack` from the `allPossibleElements` set.
				if (node.type.startsWith('mdx') || isCustomComponent) {
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
				if (node.type === 'element' || node.type === 'mdxJsxFlowElement') {
					elementStack.push(node);
					allPossibleElements.add(node);
				}
			},
			leave(node, _, __, parents) {
				// Do the reverse of the if condition above, popping the `elementStack`,
				// and consolidating `allPossibleElements` as a subtree root.
				if (node.type === 'element' || node.type === 'mdxJsxFlowElement') {
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

		// For all possible subtree roots, collapse them into `set:html` and
		// strip of their children
		for (const el of allPossibleElements) {
			if (el.type === 'mdxJsxFlowElement') {
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
	};
}
