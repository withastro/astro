import { createElement, startTransition } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import {
	buildIslandTree,
	discoverIslandsInTree,
	findRootIsland,
	islandDataMap,
	renderTreeWithPortals,
	rootMap as sharedRootMap,
	type IslandData,
} from './shared-context.js';
import StaticHtml from './static-html.js';

function isAlreadyHydrated(element: HTMLElement) {
	for (const key in element) {
		if (key.startsWith('__reactContainer')) {
			return key as keyof HTMLElement;
		}
	}
}

function createReactElementFromDOMElement(element: any): any {
	let attrs: Record<string, string> = {};
	for (const attr of element.attributes) {
		attrs[attr.name] = attr.value;
	}
	// If the element has no children, we can create a simple React element
	if (element.firstChild === null) {
		return createElement(element.localName, attrs);
	}

	return createElement(
		element.localName,
		attrs,
		Array.from(element.childNodes)
			.map((c: any) => {
				if (c.nodeType === Node.TEXT_NODE) {
					return c.data;
				} else if (c.nodeType === Node.ELEMENT_NODE) {
					return createReactElementFromDOMElement(c);
				} else {
					return undefined;
				}
			})
			.filter((a) => !!a),
	);
}

function getChildren(childString: string, experimentalReactChildren: boolean) {
	if (experimentalReactChildren && childString) {
		let children = [];
		let template = document.createElement('template');
		template.innerHTML = childString;
		for (let child of template.content.children) {
			children.push(createReactElementFromDOMElement(child));
		}
		return children;
	} else if (childString) {
		return createElement(StaticHtml, { value: childString });
	} else {
		return undefined;
	}
}

// Keep a map of roots so we can reuse them on re-renders
let rootMap = new WeakMap<HTMLElement, Root>();
const getOrCreateRoot = (element: HTMLElement, creator: () => Root) => {
	let root = rootMap.get(element);
	if (!root) {
		root = creator();
		rootMap.set(element, root);
	}
	return root;
};

/**
 * Hydrate a tree of islands using a shared React root and portals
 */
function hydrateSharedTree(rootElement: HTMLElement) {
	const rootInfo = sharedRootMap.get(rootElement);
	if (!rootInfo) {
		return;
	}

	// Skip if already rendered
	if (rootInfo.rendered) {
		return;
	}

	// Check if all islands have their data
	const allIslandsReady = Array.from(rootInfo.pendingIslands).every(island =>
		islandDataMap.has(island)
	);

	if (!allIslandsReady) {
		return;
	}

	// Create shared root if needed
	if (!rootInfo.root) {
		const container = document.createElement('div');
		container.style.display = 'none';
		container.id = `astro-react-root-${Math.random().toString(36).slice(2)}`;
		document.body.appendChild(container);

		// Build tree from all pending islands
		const tree = buildIslandTree(Array.from(rootInfo.pendingIslands));

		// Render tree with portals (only renders islands that have component data)
		const reactTree = renderTreeWithPortals(tree);

		// Use createRoot since we're not hydrating the container itself
		rootInfo.root = createRoot(container);
		rootInfo.root.render(reactTree);

		// Mark as rendered
		rootInfo.rendered = true;

		// Clean up on unmount
		rootElement.addEventListener(
			'astro:unmount',
			() => {
				rootInfo.root?.unmount();
				container.remove();
			},
			{ once: true },
		);
	}
}

export default (element: HTMLElement) =>
	(
		Component: any,
		props: Record<string, any>,
		{ default: children, ...slotted }: Record<string, any>,
		{ client }: Record<string, string>,
	) => {
		if (!element.hasAttribute('ssr')) return;

		// Check if this island should use shared context
		const useSharedContext = element.hasAttribute('data-react-shared-context');

		if (useSharedContext) {
			// Shared context mode: use portals and shared root
			const rootElement = findRootIsland(element);

			// Get or create root info
			let rootInfo = sharedRootMap.get(rootElement);
			if (!rootInfo) {
				// Discover all islands in this tree upfront
				const islands = discoverIslandsInTree(rootElement);

				rootInfo = {
					root: null,
					pendingIslands: new Set(islands),
					rendered: false,
				};
				sharedRootMap.set(rootElement, rootInfo);
			}

			// Prepare props with slots
			for (const [key, value] of Object.entries(slotted)) {
				props[key] = createElement(StaticHtml, { value, name: key });
			}

			// Add children
			const childrenElement = getChildren(children, element.hasAttribute('data-react-children'));
			if (childrenElement) {
				props.children = childrenElement;
			}

			// Store island data
			const islandData: IslandData = {
				Component,
				props,
				slotted,
				client,
			};
			islandDataMap.set(element, islandData);

			const rootKey = isAlreadyHydrated(element);
			// HACK: delete internal react marker for nested components to suppress aggressive warnings
			if (rootKey) {
				delete element[rootKey];
			}

			// Schedule hydration
			startTransition(() => {
				queueMicrotask(() => {
					hydrateSharedTree(rootElement);
				});
			});

			// IMPORTANT: Return early to prevent normal hydration!
			// The portal rendering should be the ONLY rendering that happens
			return;
		} else {
			// Original mode: independent roots per island
			const actionKey = element.getAttribute('data-action-key');
			const actionName = element.getAttribute('data-action-name');
			const stringifiedActionResult = element.getAttribute('data-action-result');

			const formState =
				actionKey && actionName && stringifiedActionResult
					? [JSON.parse(stringifiedActionResult), actionKey, actionName]
					: undefined;

			const renderOptions = {
				identifierPrefix: element.getAttribute('prefix'),
				formState,
			};
			for (const [key, value] of Object.entries(slotted)) {
				props[key] = createElement(StaticHtml, { value, name: key });
			}

			const componentEl = createElement(
				Component,
				props,
				getChildren(children, element.hasAttribute('data-react-children')),
			);
			const rootKey = isAlreadyHydrated(element);
			// HACK: delete internal react marker for nested components to suppress aggressive warnings
			if (rootKey) {
				delete element[rootKey];
			}
			if (client === 'only') {
				return startTransition(() => {
					const root = getOrCreateRoot(element, () => {
						const r = createRoot(element);
						element.addEventListener('astro:unmount', () => r.unmount(), { once: true });
						return r;
					});
					root.render(componentEl);
				});
			}
			startTransition(() => {
				const root = getOrCreateRoot(element, () => {
					const r = hydrateRoot(element, componentEl, renderOptions as any);
					element.addEventListener('astro:unmount', () => r.unmount(), { once: true });
					return r;
				});
				root.render(componentEl);
			});
		}
	};
