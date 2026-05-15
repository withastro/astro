import { makePageDataKey } from './plugins/util.js';
function getPageData(internals, route, component) {
	let pageData = internals.pagesByKeys.get(makePageDataKey(route, component));
	if (pageData) {
		return pageData;
	}
	return void 0;
}
function cssOrder(a, b) {
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
function mergeInlineCss(acc, current) {
	const lastAdded = acc.at(acc.length - 1);
	const lastWasInline = lastAdded?.type === 'inline';
	const currentIsInline = current?.type === 'inline';
	if (lastWasInline && currentIsInline) {
		const merged = { type: 'inline', content: lastAdded.content + current.content };
		acc[acc.length - 1] = merged;
		return acc;
	}
	acc.push(current);
	return acc;
}
export { cssOrder, getPageData, mergeInlineCss };
