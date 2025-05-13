import type { SSRResult } from 'astro';

const contexts = new WeakMap<SSRResult, { currentIndex: number; readonly id: string }>();

const ID_PREFIX = 's';

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
