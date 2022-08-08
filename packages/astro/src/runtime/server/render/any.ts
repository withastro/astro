import { AstroComponent, renderAstroComponent } from './astro.js';
import { markHTMLString, HTMLString, escapeHTML } from '../escape.js';
import { stringifyChunk } from './common.js';

export async function* renderChild(child: any): AsyncIterable<any> {
	child = await child;
	if (child instanceof HTMLString) {
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
	} else if (typeof child === 'object' && Symbol.asyncIterator in child) {
		yield* child;
	} else {
		yield child;
	}
}

export async function renderSlot(result: any, slotted: string, fallback?: any): Promise<string> {
	if (slotted) {
		let iterator = renderChild(slotted);
		let content = '';
		for await (const chunk of iterator) {
			if ((chunk as any).type === 'directive') {
				content += stringifyChunk(result, chunk);
			} else {
				content += chunk;
			}
		}
		return markHTMLString(content);
	}
	return fallback;
}
