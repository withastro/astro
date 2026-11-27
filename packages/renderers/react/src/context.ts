import type { SSRResult } from '@astrojs/runtime/types';

const contexts = new WeakMap<SSRResult, { currentIndex: number; readonly id: string }>();

const ID_PREFIX = 'r';

function getContext(rendererContextResult: SSRResult) {
	if (contexts.has(rendererContextResult)) {
		return contexts.get(rendererContextResult);
	}
	const ctx = {
		currentIndex: 0,
		get id() {
			return ID_PREFIX + this.currentIndex.toString();
		},
	};
	contexts.set(rendererContextResult, ctx);
	return ctx;
}

export function incrementId(rendererContextResult: SSRResult) {
	const ctx = getContext(rendererContextResult)!;
	const id = ctx.id;
	ctx.currentIndex++;
	return id;
}

const componentCounts = new WeakMap<SSRResult, Map<unknown, number>>();

/**
 * Returns how many earlier `renderToStaticMarkup()` calls for this page rendered `Component`:
 * 0 for the first call, 1 for the second, and so on.
 */
export function incrementComponentIndex(rendererContextResult: SSRResult, Component: unknown) {
	let counts = componentCounts.get(rendererContextResult);
	if (!counts) {
		counts = new Map();
		componentCounts.set(rendererContextResult, counts);
	}
	const index = counts.get(Component) ?? 0;
	counts.set(Component, index + 1);
	return index;
}
