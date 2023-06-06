import { escapeHTML, isHTMLString, markHTMLString } from '../escape.js';
import {
	isAstroComponentInstance,
	isRenderTemplateResult,
	renderAstroTemplateResult,
} from './astro/index.js';
import { SlotString } from './slot.js';
import { bufferIterators } from './util.js';

export async function* renderChild(child: any): AsyncIterable<any> {
	child = await child;
	if (child instanceof SlotString) {
		if (child.instructions) {
			yield* child.instructions;
		}
		yield child;
	} else if (isHTMLString(child)) {
		yield child;
	} else if (Array.isArray(child)) {
		const bufferedIterators = bufferIterators(child.map((c) => renderChild(c)));
		for (const value of bufferedIterators) {
			yield markHTMLString(await value);
		}
	} else if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		yield* renderChild(child());
	} else if (typeof child === 'string') {
		yield markHTMLString(escapeHTML(child));
	} else if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
	} else if (isRenderTemplateResult(child)) {
		yield* renderAstroTemplateResult(child);
	} else if (isAstroComponentInstance(child)) {
		yield* child.render();
	} else if (ArrayBuffer.isView(child)) {
		yield child;
	} else if (
		typeof child === 'object' &&
		(Symbol.asyncIterator in child || Symbol.iterator in child)
	) {
		yield* child;
	} else {
		yield child;
	}
}
