import { createElement, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import type { Root } from 'react-dom/client';

export interface IslandNode {
	element: HTMLElement;
	children: IslandNode[];
}

export interface IslandData {
	Component: any;
	props: Record<string, any>;
	slotted: Record<string, any>;
	client: string;
}

export interface RootInfo {
	root: Root | null;
	pendingIslands: Set<HTMLElement>;
	rendered: boolean;
}

// Map from root island element -> shared root info
export const rootMap = new Map<HTMLElement, RootInfo>();

// Map from island element -> component data
export const islandDataMap = new Map<HTMLElement, IslandData>();

/**
 * Find the topmost astro-island in the DOM tree by walking up from the given element
 */
export function findRootIsland(element: HTMLElement): HTMLElement {
	let current: Element | null = element;
	let lastIsland: HTMLElement = element;

	// Walk up the DOM tree finding astro-islands
	while (current) {
		const parentIsland: Element | null = current.parentElement?.closest('astro-island') || null;
		if (parentIsland) {
			lastIsland = parentIsland as HTMLElement;
			current = parentIsland;
		} else {
			break;
		}
	}

	return lastIsland;
}

/**
 * Build a tree structure of islands based on DOM nesting.
 * Returns root-level islands (islands that are not nested inside other islands in the provided list)
 */
export function buildIslandTree(islands: HTMLElement[]): IslandNode[] {
	const islandMap = new Map<HTMLElement, IslandNode>();

	// Create nodes for all islands
	for (const island of islands) {
		if (!islandMap.has(island)) {
			islandMap.set(island, {
				element: island,
				children: [],
			});
		}
	}

	// Build parent-child relationships
	for (const island of islands) {
		const node = islandMap.get(island)!;

		// Find parent island by walking up the DOM
		let parent: Element | null = island.parentElement;
		while (parent) {
			if (parent.tagName === 'ASTRO-ISLAND' && islandMap.has(parent as HTMLElement)) {
				// Found a parent island in our set
				const parentNode = islandMap.get(parent as HTMLElement)!;
				parentNode.children.push(node);
				break;
			}
			parent = parent.parentElement;
		}
	}

	// Return root-level islands (those not nested in another island)
	return Array.from(islandMap.values()).filter((node) => {
		// A root node is one where no other island contains it
		return !islands.some((island) => island !== node.element && island.contains(node.element));
	});
}

/**
 * Recursively render the island tree with portals.
 * Only renders islands that have component data available.
 */
export function renderTreeWithPortals(nodes: IslandNode[]): ReactElement {
	return createElement(
		'div',
		null,
		nodes.map((node, idx) => {
			const islandData = islandDataMap.get(node.element);

			// If this island hasn't hydrated yet, skip it
			if (!islandData?.Component) {
				return null;
			}

			// Hide SSR content before rendering portal
			if (!node.element.hasAttribute('data-portal-rendered')) {
				// For each direct child, check if it's SSR content
				const children = Array.from(node.element.children);
				for (const child of children) {
					// Don't hide astro-island elements as they need to be there for nested portals
					if (child.tagName === 'ASTRO-ISLAND') {
						continue;
					}

					// Don't hide elements that contain nested astro-islands
					const hasNestedIslands = child.querySelector('astro-island') !== null;
					if (hasNestedIslands) {
						continue;
					}

					// Hide leaf SSR content
					child.setAttribute('data-original-ssr', 'true');
					(child as HTMLElement).style.display = 'none';
				}

				node.element.setAttribute('data-portal-rendered', 'true');
			}

			// Recursively render children
			const children =
				node.children.length > 0 ? renderTreeWithPortals(node.children) : undefined;

			// Create the component element
			const componentEl = createElement(islandData.Component, islandData.props, children);

			// Portal it to the actual DOM location
			const portalKey = `island-${node.element.id || idx}`;

			return createPortal(componentEl, node.element, portalKey);
		}),
	);
}

/**
 * Discover all astro-island elements within a root element's subtree
 */
export function discoverIslandsInTree(rootElement: HTMLElement): HTMLElement[] {
	const islands: HTMLElement[] = [rootElement];

	// Find all nested astro-islands
	const nested = rootElement.querySelectorAll('astro-island');
	for (const island of Array.from(nested)) {
		islands.push(island as HTMLElement);
	}

	return islands;
}
