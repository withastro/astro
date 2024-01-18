import { HTMLString, escapeHTML, markHTMLString } from '../escape.js';
import { isAstroComponentInstance, isRenderTemplateResult } from './astro/index.js';
import { isRenderInstance, type RenderDestination } from './common.js';
import { SlotString } from './slot.js';
import { renderToBufferDestination } from './util.js';

export async function renderChild(destination: RenderDestination, child: any) {
	if (child.then) {
		child = await child;
	}

	// NOTE: Sort if statements from the most to least common
	if (typeof child === 'string') {
		destination.write(markHTMLString(escapeHTML(child)));
	} else if (!child && child !== 0) {
		// do nothing, safe to ignore falsey values.
	} else if (child instanceof HTMLString) {
		destination.write(child);
	} else if (child instanceof SlotString) {
		destination.write(child);
	} else if (Array.isArray(child)) {
		// Render all children eagerly and in parallel
		const childRenders = child.map((c) => {
			return renderToBufferDestination((bufferDestination) => {
				return renderChild(bufferDestination, c);
			});
		});
		for (const childRender of childRenders) {
			if (!childRender) continue;
			await childRender.renderToFinalDestination(destination);
		}
	} else if (typeof child === 'function') {
		// Special: If a child is a function, call it automatically.
		// This lets you do {() => ...} without the extra boilerplate
		// of wrapping it in a function and calling it.
		await renderChild(destination, child());
	} else if (isRenderInstance(child)) {
		await child.render(destination);
	} else if (isRenderTemplateResult(child)) {
		await child.render(destination);
	} else if (isAstroComponentInstance(child)) {
		await child.render(destination);
	} else if (ArrayBuffer.isView(child)) {
		destination.write(child);
	} else if (
		typeof child === 'object' &&
		(Symbol.asyncIterator in child || Symbol.iterator in child)
	) {
		for await (const value of child) {
			await renderChild(destination, value);
		}
	} else {
		destination.write(child);
	}
}
