import type { BuildInternals } from './internal.js';
import type { PageBuildData, StylesheetAsset } from './types.js';
import { makePageDataKey } from './plugins/util.js';

/**
 * From its route and component, get the page data from the build internals.
 * @param internals Build Internals with all the pages
 * @param route The route of the page, used to identify the page
 * @param component The component of the page, used to identify the page
 */
export function getPageData(
	internals: BuildInternals,
	route: string,
	component: string,
): PageBuildData | undefined {
	let pageData = internals.pagesByKeys.get(makePageDataKey(route, component));
	if (pageData) {
		return pageData;
	}
	return undefined;
}

interface OrderInfo {
	depth: number;
	order: number;
}

/**
 * Sort a page's CSS by depth. A higher depth means that the CSS comes from shared subcomponents.
 * A lower depth means it comes directly from the top-level page.
 * Can be used to sort stylesheets so that shared rules come first
 * and page-specific rules come after.
 */
export function cssOrder(a: OrderInfo, b: OrderInfo) {
	let depthA = a.depth,
		depthB = b.depth,
		orderA = a.order,
		orderB = b.order;

	if (orderA === -1 && orderB >= 0) {
		return 1;
	} else if (orderB === -1 && orderA >= 0) {
		return -1;
	} else if (orderA > orderB) {
		return 1;
	} else if (orderA < orderB) {
		return -1;
	} else {
		if (depthA === -1) {
			return -1;
		} else if (depthB === -1) {
			return 1;
		} else {
			return depthA > depthB ? -1 : 1;
		}
	}
}

/**
 * Merges inline CSS into as few stylesheets as possible,
 * preserving ordering when there are non-inlined in between.
 *
 * CSS chunks containing `@import` are never merged with other chunks.
 * Per CSS spec, `@import` rules must appear at the top of a stylesheet
 * or browsers silently ignore them. Keeping these chunks as separate
 * `<style>` tags ensures the `@import` stays at the top of its own stylesheet.
 */
export function mergeInlineCss(
	acc: Array<StylesheetAsset>,
	current: StylesheetAsset,
): Array<StylesheetAsset> {
	const lastAdded = acc.at(acc.length - 1);
	const lastWasInline = lastAdded?.type === 'inline';
	const currentIsInline = current?.type === 'inline';
	if (lastWasInline && currentIsInline) {
		// Don't merge chunks that contain @import rules — they must be at the
		// top of their stylesheet to be valid CSS.
		const currentHasImport = current.content.includes('@import');
		const lastHasImport = lastAdded.content.includes('@import');
		if (!currentHasImport && !lastHasImport) {
			const merged = { type: 'inline' as const, content: lastAdded.content + current.content };
			acc[acc.length - 1] = merged;
			return acc;
		}
	}
	acc.push(current);
	return acc;
}
