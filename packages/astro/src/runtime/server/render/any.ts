import { escapeHTML, isHTMLString, markHTMLString } from '../escape.js';
import { AstroComponent, renderAstroComponent } from './astro.js';
import { SlotString } from './slot.js';

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
		for (const value of child) {
			yield markHTMLString(await renderChild(value));
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
	}
	// Add a comment explaining why each of these are needed.
	// Maybe create clearly named function for what this is doing.
	else if (
		child instanceof AstroComponent ||
		Object.prototype.toString.call(child) === '[object AstroComponent]'
	) {
		yield* renderAstroComponent(child);
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
